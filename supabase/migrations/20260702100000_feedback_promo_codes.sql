create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null default 'agnieszka',
  rating text not null check (rating in ('good', 'corrected')),
  reason text not null default 'other',
  language text not null default 'pl',
  source_text text,
  draft jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_feedback enable row level security;

drop policy if exists "Users can insert own ai feedback" on public.ai_feedback;
create policy "Users can insert own ai feedback"
on public.ai_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can read own ai feedback" on public.ai_feedback;
create policy "Users can read own ai feedback"
on public.ai_feedback
for select
to authenticated
using (auth.uid() = user_id);

create table if not exists public.promo_codes (
  code text primary key,
  entitlement text not null check (entitlement in ('premium_access', 'standard_recipes_pack', 'personalized_recipes_pack')),
  duration_days integer not null default 30 check (duration_days > 0 and duration_days <= 365),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.promo_codes enable row level security;

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.promo_codes(code) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (code, user_id)
);

alter table public.promo_redemptions enable row level security;

drop policy if exists "Users can read own promo redemptions" on public.promo_redemptions;
create policy "Users can read own promo redemptions"
on public.promo_redemptions
for select
to authenticated
using (auth.uid() = user_id);

insert into public.promo_codes (code, entitlement, duration_days, max_redemptions, active, note)
values ('NOURIA-BETA', 'premium_access', 90, 100, true, 'Closed beta tester access')
on conflict (code) do update
set entitlement = excluded.entitlement,
    duration_days = excluded.duration_days,
    max_redemptions = excluded.max_redemptions,
    active = excluded.active,
    note = excluded.note,
    updated_at = now();
