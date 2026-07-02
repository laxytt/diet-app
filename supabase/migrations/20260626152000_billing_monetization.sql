create table if not exists public.billing_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement text not null,
  active boolean not null default false,
  source text not null default 'manual',
  product_id text,
  store text,
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, entitlement)
);

create table if not exists public.billing_events (
  id bigserial primary key,
  provider_event_id text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  product_id text,
  store text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,
  metric text not null,
  used integer not null default 0,
  "limit" integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period, metric)
);

create index if not exists billing_entitlements_user_active_idx
on public.billing_entitlements (user_id, active);

create index if not exists billing_events_user_created_idx
on public.billing_events (user_id, created_at desc);

alter table public.billing_entitlements enable row level security;
alter table public.billing_events enable row level security;
alter table public.usage_counters enable row level security;

drop policy if exists "Users can read their billing entitlements" on public.billing_entitlements;
create policy "Users can read their billing entitlements"
on public.billing_entitlements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read their usage counters" on public.usage_counters;
create policy "Users can read their usage counters"
on public.usage_counters
for select
to authenticated
using (auth.uid() = user_id);

drop function if exists public.billing_consume_usage(uuid, text, text, integer);
create function public.billing_consume_usage(
  p_user_id uuid,
  p_metric text,
  p_period text,
  p_limit integer
)
returns table(used integer, "limit" integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer;
  v_limit integer;
begin
  if p_user_id is null or p_metric is null or p_period is null or p_limit is null or p_limit < 1 then
    raise exception 'Invalid usage counter arguments';
  end if;

  insert into public.usage_counters as uc_target (user_id, period, metric, used, "limit", updated_at)
  values (p_user_id, p_period, p_metric, 1, p_limit, now())
  on conflict (user_id, period, metric)
  do update set
    used = uc_target.used + 1,
    "limit" = excluded."limit",
    updated_at = now()
  where uc_target.used < excluded."limit"
  returning uc_target.used, uc_target."limit"
  into v_used, v_limit;

  if found then
    return query select v_used, v_limit;
    return;
  end if;

  return query
  select uc.used + 1, uc."limit"
  from public.usage_counters uc
  where uc.user_id = p_user_id
    and uc.period = p_period
    and uc.metric = p_metric;
end;
$$;
