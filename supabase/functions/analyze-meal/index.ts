import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const mealSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['meal_name', 'confidence', 'notes', 'items', 'totals'],
  properties: {
    meal_name: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    notes: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'grams', 'calories', 'protein', 'carbs', 'fat'],
        properties: {
          name: { type: 'string' },
          grams: { type: 'number', minimum: 0 },
          calories: { type: 'number', minimum: 0 },
          protein: { type: 'number', minimum: 0 },
          carbs: { type: 'number', minimum: 0 },
          fat: { type: 'number', minimum: 0 }
        }
      }
    },
    totals: {
      type: 'object',
      additionalProperties: false,
      required: ['calories', 'protein', 'carbs', 'fat'],
      properties: {
        calories: { type: 'number', minimum: 0 },
        protein: { type: 'number', minimum: 0 },
        carbs: { type: 'number', minimum: 0 },
        fat: { type: 'number', minimum: 0 }
      }
    }
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json({ error: 'Missing OPENAI_API_KEY' }, 500);
  }

  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-5.4-mini';
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '').trim();
  const imageDataUrl = normalizeImageDataUrl(body.imageDataUrl || body.image || '');
  const profile = String(body.profile || '').trim();
  const locale = String(body.locale || body.language || 'pl').trim().toLowerCase().startsWith('en') ? 'en' : 'pl';

  if (!text && !imageDataUrl) {
    return json({ error: 'Missing meal text or image' }, 400);
  }

  if (imageDataUrl) {
    const premium = await userHasPremiumAccess(auth.user.id);
    if (!premium) {
      return json({
        ok: false,
        code: 'upgrade_required',
        metric: 'ai_meal_analysis',
        feature: 'meal_photo_analysis',
        plan: 'free'
      }, 402);
    }
  }

  const usage = await consumeUsage(auth.user.id, 'ai_meal_analysis');
  if (!usage.ok) {
    return json(usage, 402);
  }

  const prompt = [
    locale === 'en'
      ? 'Use English for meal_name, item names and notes.'
      : 'Uzywaj jezyka polskiego w meal_name, nazwach skladnikow i notes.',
    locale === 'en'
      ? 'The user expects English UI text and natural English food names.'
      : 'Uzytkownik oczekuje polskiego tekstu UI i naturalnych polskich nazw jedzenia.',
    'Jesteś asystentem do estymacji kalorii i makro z opisu posiłku.',
    'Zwracaj wyłącznie JSON zgodny ze schematem.',
    'Szacuj rozsądnie, jeśli opis jest niepełny. Nie zmyślaj skrajnie precyzyjnych wartości.',
    'Makro podawaj w gramach, kalorie w kcal. Uwzględnij kuchenne miary typu łyżka oleju.',
    'Jeśli opis wygląda jak przepis ze składnikami, policz sumę składników.',
    imageDataUrl ? 'Jeśli dostałeś zdjęcie, rozpoznaj widoczne produkty i porcje. Zaznacz niepewność w polu notes.' : '',
    profile ? `Profil użytkownika: ${profile}.` : ''
  ].join('\n');
  const userContent = imageDataUrl
    ? [
        { type: 'input_text', text: text || 'Rozpoznaj posiłek ze zdjęcia i oszacuj kalorie oraz makro.' },
        { type: 'input_image', image_url: imageDataUrl }
      ]
    : text;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: prompt },
        { role: 'user', content: userContent }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'meal_nutrition_estimate',
          strict: true,
          schema: mealSchema
        }
      },
      reasoning: { effort: 'low' },
      store: false
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return json({ error: data.error?.message || 'OpenAI request failed' }, response.status);
  }

  const outputText = data.output_text || extractOutputText(data);
  if (!outputText) {
    return json({ error: 'OpenAI response did not include JSON text' }, 502);
  }

  return json({ result: JSON.parse(outputText) });
});

async function requireUser(request: Request): Promise<{ user: any } | { response: Response }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return { response: json({ error: 'Missing Supabase environment' }, 500) };
  }

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { response: json({ error: 'Missing authorization token' }, 401) };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  }) as any;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { response: json({ error: 'Invalid authorization token' }, 401) };
  }
  return { user: data.user };
}

function normalizeImageDataUrl(value: unknown): string {
  const text = String(value || '').trim();
  if (!text) return '';
  if (!/^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(text)) return '';
  return text.replace(/\s/g, '');
}

async function userHasPremiumAccess(userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing billing environment');
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  }) as any;
  return isPremium(service, userId);
}

async function consumeUsage(userId: string, metric: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, error: 'Missing billing environment' };
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  }) as any;
  const period = currentPeriod();
  const premium = await isPremium(service, userId);
  const limit = premium ? 300 : 10;
  const { data, error } = await service.rpc('billing_consume_usage', {
    p_user_id: userId,
    p_metric: metric,
    p_period: period,
    p_limit: limit
  });
  if (error) return { ok: false, error: error.message };
  const row = Array.isArray(data) && data[0] ? data[0] : null;
  if (!row || Number(row.used || 0) > limit) {
    return { ok: false, code: 'upgrade_required', metric, used: limit, limit, plan: premium ? 'premium' : 'free' };
  }
  return { ok: true, metric, used: Number(row.used || 0), limit, plan: premium ? 'premium' : 'free' };
}

async function isPremium(service: any, userId: string) {
  const { data, error } = await service
    .from('billing_entitlements')
    .select('active, expires_at')
    .eq('user_id', userId)
    .eq('entitlement', 'premium_access')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data && data.active && (!data.expires_at || new Date(data.expires_at).getTime() > Date.now()));
}

function currentPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function extractOutputText(data: any): string {
  const content = data.output?.flatMap((item: any) => item.content || []) || [];
  const textPart = content.find((part: any) => part.type === 'output_text' || part.text);
  return textPart?.text || '';
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
