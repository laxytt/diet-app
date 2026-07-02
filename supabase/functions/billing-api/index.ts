import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-revenuecat-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const ENTITLEMENTS = ['premium_access', 'standard_recipes_pack', 'personalized_recipes_pack'];
const PRODUCT_ENTITLEMENTS: Record<string, string[]> = {
  dd_premium_monthly: ['premium_access'],
  dd_premium_yearly: ['premium_access'],
  dd_recipe_pack_standard_001: ['standard_recipes_pack'],
  dd_recipe_pack_personalized_001: ['personalized_recipes_pack']
};
const AI_LIMITS = {
  meal: { free: 10, premium: 300 },
  recipes: { free: 2, premium: 30 }
};

type Actor = { user: any; email: string };
type AuthResult = Actor | { response: Response };

Deno.serve(async (request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ error: 'Missing Supabase billing environment' }, 500);

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  }) as any;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '').trim();

  try {
    if (action === 'revenuecatWebhook' || isRevenueCatWebhookPayload(body)) {
      return await handleRevenueCatWebhook(service, request, body);
    }

    const actor = await requireUser(request, service);
    if ('response' in actor) return actor.response;

    if (action === 'me') return json(await billingSnapshot(service, actor.user.id));
    if (action === 'consumeUsage') return json(await consumeUsage(service, actor.user.id, sanitizeMetric(body.metric)));
    if (action === 'redeemPromoCode') return json(await redeemPromoCode(service, actor, body));

    if (action === 'grantEntitlement' || action === 'revokeEntitlement') {
      const admin = await requireAdmin(service, actor);
      if ('response' in admin) return admin.response;
      return json(await setManualEntitlement(service, admin, body, action === 'grantEntitlement'));
    }

    return json({ error: 'Unknown billing action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Billing action failed' }, 400);
  }
});

function isRevenueCatWebhookPayload(body: any) {
  if (!body || typeof body !== 'object') return false;
  const event = body.event && typeof body.event === 'object' ? body.event : null;
  return Boolean(event && (event.app_user_id || event.original_app_user_id || event.product_id || event.type));
}

async function requireUser(request: Request, service: any): Promise<AuthResult> {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { response: json({ error: 'Missing authorization token' }, 401) };

  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user || !data.user.email) return { response: json({ error: 'Invalid authorization token' }, 401) };
  return { user: data.user, email: normalizeEmail(data.user.email) };
}

async function requireAdmin(service: any, actor: Actor): Promise<Actor | { response: Response }> {
  const { data, error } = await service
    .from('admin_users')
    .select('email')
    .eq('email', actor.email)
    .maybeSingle();
  if (error) return { response: json({ error: error.message }, 500) };
  if (!data) return { response: json({ error: 'Admin access required' }, 403) };
  return actor;
}

async function billingSnapshot(service: any, userId: string) {
  const period = currentPeriod();
  const { data: entitlementRows, error: entitlementsError } = await service
    .from('billing_entitlements')
    .select('entitlement, active, source, product_id, store, expires_at, updated_at')
    .eq('user_id', userId);
  if (entitlementsError) throw entitlementsError;

  const entitlements = normalizeEntitlements(entitlementRows || []);
  const isPremium = Boolean(entitlements.premium_access);
  const { data: counters, error: countersError } = await service
    .from('usage_counters')
    .select('metric, used, limit, updated_at')
    .eq('user_id', userId)
    .eq('period', period);
  if (countersError) throw countersError;

  const usage = usageSnapshot(counters || [], isPremium);
  return {
    plan: isPremium ? 'premium' : 'free',
    isPremium,
    entitlements,
    usage,
    period,
    showAds: !isPremium,
    products: {
      subscriptions: ['dd_premium_monthly', 'dd_premium_yearly'],
      oneTime: ['dd_recipe_pack_standard_001', 'dd_recipe_pack_personalized_001']
    }
  };
}

async function consumeUsage(service: any, userId: string, metric: 'ai_meal_analysis' | 'ai_recipe_generation') {
  const snapshot = await billingSnapshot(service, userId);
  const limit = metric === 'ai_recipe_generation'
    ? (snapshot.isPremium ? AI_LIMITS.recipes.premium : AI_LIMITS.recipes.free)
    : (snapshot.isPremium ? AI_LIMITS.meal.premium : AI_LIMITS.meal.free);
  const { data, error } = await service.rpc('billing_consume_usage', {
    p_user_id: userId,
    p_metric: metric,
    p_period: snapshot.period,
    p_limit: limit
  });
  if (error) throw error;

  const row = Array.isArray(data) && data[0] ? data[0] : null;
  if (!row || Number(row.used || 0) > limit) {
    return {
      ok: false,
      code: 'upgrade_required',
      metric,
      used: limit,
      limit,
      plan: snapshot.plan
    };
  }

  return {
    ok: true,
    metric,
    used: Number(row.used || 0),
    limit,
    plan: snapshot.plan
  };
}

async function setManualEntitlement(service: any, actor: Actor, body: any, active: boolean) {
  const email = normalizeEmail(body.email);
  const entitlement = sanitizeEntitlement(body.entitlement);
  if (!email) throw new Error('Missing user email');
  const target = await findUserByEmail(service, email);
  if (!target) throw new Error('User account does not exist yet');

  const payload = {
    user_id: target.id,
    entitlement,
    active,
    source: 'manual',
    product_id: body.productId ? String(body.productId).trim().slice(0, 120) : null,
    store: 'admin',
    expires_at: parseExpiry(body.expiresAt),
    updated_at: new Date().toISOString()
  };

  const { error } = await service.from('billing_entitlements').upsert(payload, { onConflict: 'user_id,entitlement' });
  if (error) throw error;
  await audit(service, actor, active ? 'grant-entitlement' : 'revoke-entitlement', email, target.id, {
    entitlement,
    expiresAt: payload.expires_at
  });
  return { ok: true };
}

async function redeemPromoCode(service: any, actor: Actor, body: any) {
  const code = String(body.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{2,48}$/.test(code)) throw new Error('Invalid promo code');

  const { data: promo, error: promoError } = await service
    .from('promo_codes')
    .select('code, entitlement, duration_days, max_redemptions, used_count, active, expires_at')
    .eq('code', code)
    .maybeSingle();
  if (promoError) throw promoError;
  if (!promo || !promo.active) throw new Error('Promo code is not active');
  if (promo.expires_at && new Date(promo.expires_at).getTime() <= Date.now()) throw new Error('Promo code has expired');
  if (promo.max_redemptions !== null && Number(promo.used_count || 0) >= Number(promo.max_redemptions || 0)) {
    throw new Error('Promo code limit has been reached');
  }

  const entitlement = sanitizeEntitlement(promo.entitlement);
  const { data: existing, error: existingError } = await service
    .from('promo_redemptions')
    .select('id, expires_at')
    .eq('code', code)
    .eq('user_id', actor.user.id)
    .maybeSingle();
  if (existingError) throw existingError;

  const expiresAt = new Date(Date.now() + Number(promo.duration_days || 30) * 86400000).toISOString();
  if (!existing) {
    const { error: redemptionError } = await service.from('promo_redemptions').insert({
      code,
      user_id: actor.user.id,
      entitlement,
      expires_at: expiresAt
    });
    if (redemptionError) {
      const message = String(redemptionError.message || '').toLowerCase();
      if (!message.includes('duplicate')) throw redemptionError;
    } else {
      await service
        .from('promo_codes')
        .update({ used_count: Number(promo.used_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('code', code);
    }
  }

  const finalExpiry = existing && existing.expires_at ? existing.expires_at : expiresAt;
  const { error: entitlementError } = await service.from('billing_entitlements').upsert({
    user_id: actor.user.id,
    entitlement,
    active: true,
    source: 'promo_code',
    product_id: code,
    store: 'backend',
    expires_at: finalExpiry,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,entitlement' });
  if (entitlementError) throw entitlementError;

  await audit(service, actor, 'redeem-promo-code', actor.email, actor.user.id, {
    code,
    entitlement,
    expiresAt: finalExpiry,
    alreadyRedeemed: Boolean(existing)
  });

  return {
    ok: true,
    alreadyRedeemed: Boolean(existing),
    entitlement,
    expiresAt: finalExpiry
  };
}

async function handleRevenueCatWebhook(service: any, request: Request, body: any) {
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (secret) {
    const header = request.headers.get('Authorization') || request.headers.get('X-RevenueCat-Signature') || '';
    if (!header.includes(secret)) return json({ error: 'Invalid RevenueCat webhook secret' }, 401);
  }

  const event = body.event && typeof body.event === 'object' ? body.event : body;
  const providerEventId = String(event.id || event.event_id || event.transaction_id || crypto.randomUUID());
  const appUserId = String(event.app_user_id || event.original_app_user_id || '').trim();
  if (!appUserId) throw new Error('Missing RevenueCat app_user_id');

  const productId = String(event.product_id || '').trim();
  const eventType = String(event.type || event.event_type || 'UNKNOWN').trim();
  const store = String(event.store || event.platform || '').trim().toLowerCase();
  const entitlements = productEntitlements(productId);
  const active = isActiveRevenueCatEvent(eventType);
  const expiresAt = event.expiration_at_ms ? new Date(Number(event.expiration_at_ms)).toISOString() : null;

  const { error: eventError } = await service.from('billing_events').insert({
    provider_event_id: providerEventId,
    user_id: appUserId,
    event_type: eventType,
    product_id: productId || null,
    store: store || null,
    raw_payload: body
  });
  if (eventError && !String(eventError.message || '').toLowerCase().includes('duplicate')) throw eventError;

  for (const entitlement of entitlements) {
    const { error } = await service.from('billing_entitlements').upsert({
      user_id: appUserId,
      entitlement,
      active,
      source: 'revenuecat',
      product_id: productId || null,
      store: store || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,entitlement' });
    if (error) throw error;
  }

  return json({ ok: true, entitlements, active });
}

function normalizeEntitlements(rows: any[]) {
  const now = Date.now();
  return rows.reduce((acc: Record<string, boolean>, row: any) => {
    const active = Boolean(row.active) && (!row.expires_at || new Date(row.expires_at).getTime() > now);
    acc[row.entitlement] = active;
    return acc;
  }, Object.fromEntries(ENTITLEMENTS.map((key) => [key, false])));
}

function usageSnapshot(rows: any[], isPremium: boolean) {
  const byMetric = new Map(rows.map((row: any) => [row.metric, row]));
  const mealLimit = isPremium ? AI_LIMITS.meal.premium : AI_LIMITS.meal.free;
  const recipeLimit = isPremium ? AI_LIMITS.recipes.premium : AI_LIMITS.recipes.free;
  return {
    ai_meal_analysis: usageRow(byMetric.get('ai_meal_analysis'), mealLimit),
    ai_recipe_generation: usageRow(byMetric.get('ai_recipe_generation'), recipeLimit)
  };
}

function usageRow(row: any, limit: number) {
  return {
    used: Math.max(0, Number(row && row.used ? row.used : 0)),
    limit,
    remaining: Math.max(0, limit - Math.max(0, Number(row && row.used ? row.used : 0)))
  };
}

function productEntitlements(productId: string) {
  const normalized = productId.split(':')[0] || productId;
  return PRODUCT_ENTITLEMENTS[productId] || PRODUCT_ENTITLEMENTS[normalized] || [];
}

function isActiveRevenueCatEvent(eventType: string) {
  const type = eventType.toUpperCase();
  return !['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE', 'PRODUCT_CHANGE', 'REFUND'].includes(type);
}

function sanitizeMetric(value: string): 'ai_meal_analysis' | 'ai_recipe_generation' {
  const metric = String(value || '').trim();
  if (metric !== 'ai_meal_analysis' && metric !== 'ai_recipe_generation') throw new Error('Invalid usage metric');
  return metric;
}

function sanitizeEntitlement(value: string) {
  const entitlement = String(value || '').trim();
  if (!ENTITLEMENTS.includes(entitlement)) throw new Error('Invalid entitlement');
  return entitlement;
}

function parseExpiry(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function currentPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function findUserByEmail(service: any, email: string) {
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) throw error;
  return (data.users || []).find((user: any) => normalizeEmail(user.email || '') === email) || null;
}

async function audit(
  service: any,
  actor: Actor,
  action: string,
  targetEmail: string,
  targetUserId: string | null,
  details: Record<string, unknown>
) {
  const { error } = await service.from('admin_audit_log').insert({
    actor_user_id: actor.user.id,
    actor_email: actor.email,
    action,
    target_user_id: targetUserId,
    target_email: targetEmail || null,
    details
  });
  if (error) throw error;
}

function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase();
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
