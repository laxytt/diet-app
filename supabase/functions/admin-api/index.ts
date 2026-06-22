import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const PROFILE_ID = 'agnieszka';
const VALID_STATUSES = new Set(['active', 'disabled', 'banned']);

type AdminActor = { user: any; email: string };
type AdminAuthResult = AdminActor | { response: Response };

Deno.serve(async (request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing Supabase admin environment' }, 500);
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) as any;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '').trim();
  const actor = await requireAdmin(request, service);
  if (isAuthResponse(actor)) return actor.response;

  try {
    if (action === 'me') {
      return json({
        admin: true,
        email: actor.email,
        userId: actor.user.id
      });
    }

    if (action === 'list') {
      return json(await listAdminData(service));
    }

    if (action === 'upsertAssignment') {
      const result = await upsertAssignment(service, actor, body);
      return json(result);
    }

    if (action === 'setStatus') {
      const result = await setStatus(service, actor, body);
      return json(result);
    }

    if (action === 'resetProgress') {
      const result = await resetProgress(service, actor, body);
      return json(result);
    }

    return json({ error: 'Unknown admin action' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Admin action failed' }, 400);
  }
});

function isAuthResponse(value: AdminAuthResult): value is { response: Response } {
  return 'response' in value;
}

async function requireAdmin(request: Request, service: any): Promise<AdminAuthResult> {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { response: json({ error: 'Missing authorization token' }, 401) };
  }

  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user || !data.user.email) {
    return { response: json({ error: 'Invalid authorization token' }, 401) };
  }

  const email = normalizeEmail(data.user.email);
  const { data: admin, error: adminError } = await service
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (adminError) {
    return { response: json({ error: adminError.message }, 500) };
  }

  if (!admin) {
    return { response: json({ error: 'Admin access required' }, 403) };
  }

  return { user: data.user, email };
}

async function listAdminData(service: any) {
  const { data: usersData, error: usersError } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 100
  });
  if (usersError) throw usersError;

  const { data: assignments, error: assignmentsError } = await service
    .from('profile_assignments')
    .select('email, user_id, profile_id, name, status, notes, created_at, updated_at, status_updated_at')
    .order('updated_at', { ascending: false });
  if (assignmentsError) throw assignmentsError;

  const { data: profiles, error: profilesError } = await service
    .from('diet_profiles')
    .select('user_id, profile_id, name, data, revision, updated_at');
  if (profilesError) throw profilesError;

  const { data: logs, error: logsError } = await service
    .from('admin_audit_log')
    .select('id, actor_email, action, target_email, details, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  if (logsError) throw logsError;

  const profileByUser = new Map((profiles || []).map((profile: any) => [`${profile.user_id}:${profile.profile_id}`, profile]));
  const assignmentByEmail = new Map((assignments || []).map((assignment: any) => [normalizeEmail(assignment.email), assignment]));

  const users = (usersData.users || []).map((user: any) => {
    const email = normalizeEmail(user.email || '');
    const assignment = (assignmentByEmail.get(email) || null) as any;
    const profile = assignment && assignment.user_id
      ? profileByUser.get(`${assignment.user_id}:${assignment.profile_id || PROFILE_ID}`) || null
      : null;
    return summarizeUser(user, assignment, profile);
  });

  (assignments || []).forEach((assignment: any) => {
    const email = normalizeEmail(assignment.email);
    if (users.some((user: any) => normalizeEmail(user.email) === email)) return;
    users.push(summarizeUser(null, assignment, null));
  });

  return {
    users: users.sort((a: any, b: any) => String(a.email).localeCompare(String(b.email))),
    logs: logs || []
  };
}

function summarizeUser(user: any, assignment: any, profile: any) {
  const data = profile && profile.data && typeof profile.data === 'object' ? profile.data : {};
  const entries = Array.isArray(data.entries) ? data.entries.length : 0;
  const foods = Array.isArray(data.foods) ? data.foods.length : 0;
  const weights = Array.isArray(data.weights) ? data.weights.length : 0;
  const water = Array.isArray(data.water) ? data.water.length : 0;

  return {
    userId: user?.id || assignment?.user_id || null,
    email: normalizeEmail(user?.email || assignment?.email || ''),
    confirmedAt: user?.email_confirmed_at || user?.confirmed_at || null,
    lastSignInAt: user?.last_sign_in_at || null,
    createdAt: user?.created_at || assignment?.created_at || null,
    assignment: assignment ? {
      profileId: assignment.profile_id,
      name: assignment.name,
      status: assignment.status || 'active',
      notes: assignment.notes || '',
      updatedAt: assignment.updated_at,
      statusUpdatedAt: assignment.status_updated_at
    } : null,
    profile: profile ? {
      revision: profile.revision || 0,
      updatedAt: profile.updated_at,
      stats: { entries, foods, weights, water }
    } : null
  };
}

async function upsertAssignment(service: any, actor: AdminActor, body: any) {
  const email = normalizeEmail(body.email);
  const name = sanitizeName(body.name || email.split('@')[0] || 'Agnieszka');
  const status = sanitizeStatus(body.status || 'active');
  const notes = String(body.notes || '').trim().slice(0, 500);
  if (!email) throw new Error('Missing user email');

  const targetUser = await findUserByEmail(service, email);
  const payload = {
    email,
    user_id: targetUser?.id || null,
    profile_id: PROFILE_ID,
    name,
    status,
    notes,
    status_updated_at: new Date().toISOString(),
    status_updated_by: actor.user.id,
    updated_at: new Date().toISOString()
  };

  const { error } = await service
    .from('profile_assignments')
    .upsert(payload, { onConflict: 'email' });
  if (error) throw error;

  await audit(service, actor, 'upsert-assignment', email, targetUser?.id || null, {
    name,
    status,
    hasUser: Boolean(targetUser),
    notes: notes ? 'present' : ''
  });

  return { ok: true };
}

async function setStatus(service: any, actor: AdminActor, body: any) {
  const email = normalizeEmail(body.email);
  const status = sanitizeStatus(body.status);
  if (!email) throw new Error('Missing user email');

  const targetUser = await findUserByEmail(service, email);
  const { error } = await service
    .from('profile_assignments')
    .update({
      status,
      user_id: targetUser?.id || null,
      status_updated_at: new Date().toISOString(),
      status_updated_by: actor.user.id,
      updated_at: new Date().toISOString()
    })
    .eq('email', email);
  if (error) throw error;

  await audit(service, actor, `set-status-${status}`, email, targetUser?.id || null, { status });
  return { ok: true };
}

async function resetProgress(service: any, actor: AdminActor, body: any) {
  const email = normalizeEmail(body.email);
  if (!email) throw new Error('Missing user email');

  const targetUser = await findUserByEmail(service, email);
  if (!targetUser) throw new Error('User account does not exist yet');

  const { data: profile, error: profileError } = await service
    .from('diet_profiles')
    .select('user_id, profile_id, data, revision')
    .eq('user_id', targetUser.id)
    .eq('profile_id', PROFILE_ID)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('Diet profile not found');

  const previousData = profile.data && typeof profile.data === 'object' ? profile.data : {};
  const { error: backupError } = await service
    .from('admin_profile_backups')
    .insert({
      target_user_id: targetUser.id,
      target_email: email,
      profile_id: PROFILE_ID,
      data: previousData,
      reason: 'admin-reset-progress',
      created_by: actor.user.id,
      created_by_email: actor.email
    });
  if (backupError) throw backupError;

  const nextData = resetProgressData(previousData);
  const nextRevision = Number(profile.revision || 0) + 1;
  const { error: updateError } = await service
    .from('diet_profiles')
    .update({
      data: nextData,
      revision: nextRevision,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', targetUser.id)
    .eq('profile_id', PROFILE_ID);
  if (updateError) throw updateError;

  await audit(service, actor, 'reset-progress', email, targetUser.id, {
    previousRevision: profile.revision || 0,
    nextRevision
  });

  return { ok: true, revision: nextRevision };
}

function resetProgressData(data: any) {
  return {
    ...(data || {}),
    entries: [],
    weights: [],
    water: [],
    activities: [],
    dailyCoach: {},
    deletedEntryIds: [],
    mealTemplates: [],
    plannedMeals: [],
    shoppingLists: [],
    weeklyReviews: {},
    undoStack: [],
    backupMeta: {
      reason: 'admin-reset-progress',
      createdAt: new Date().toISOString()
    }
  };
}

async function findUserByEmail(service: any, email: string) {
  const { data, error } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 100
  });
  if (error) throw error;
  return (data.users || []).find((user: any) => normalizeEmail(user.email || '') === email) || null;
}

async function audit(
  service: any,
  actor: AdminActor,
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

function sanitizeStatus(value: string) {
  const status = String(value || '').trim().toLowerCase();
  if (!VALID_STATUSES.has(status)) throw new Error('Invalid status');
  return status;
}

function sanitizeName(value: string) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80) || 'Agnieszka';
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
