alter table public.profile_assignments
add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.profile_assignments
add column if not exists status text not null default 'active';

alter table public.profile_assignments
add column if not exists notes text not null default '';

alter table public.profile_assignments
add column if not exists status_updated_at timestamptz not null default now();

alter table public.profile_assignments
add column if not exists status_updated_by uuid references auth.users(id) on delete set null;

alter table public.profile_assignments
drop constraint if exists profile_assignments_status_check;

alter table public.profile_assignments
add constraint profile_assignments_status_check
check (status in ('active', 'disabled', 'banned'));

update public.profile_assignments pa
set user_id = au.id
from auth.users au
where pa.user_id is null
  and lower(pa.email) = lower(au.email);

create index if not exists profile_assignments_user_id_idx
on public.profile_assignments (user_id);

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

insert into public.admin_users (email)
values ('laxytt@gmail.com')
on conflict (email) do nothing;

create table if not exists public.admin_profile_backups (
  id bigserial primary key,
  target_user_id uuid references auth.users(id) on delete set null,
  target_email text not null,
  profile_id text not null default 'agnieszka',
  data jsonb not null default '{}'::jsonb,
  reason text not null default 'admin-reset',
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists admin_profile_backups_target_idx
on public.admin_profile_backups (target_email, created_at desc);

create table if not exists public.admin_audit_log (
  id bigserial primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_email text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx
on public.admin_audit_log (created_at desc);

alter table public.admin_users enable row level security;
alter table public.admin_profile_backups enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "Users can read their profile assignment" on public.profile_assignments;
create policy "Users can read their profile assignment"
on public.profile_assignments
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Users can read their diet profiles" on public.diet_profiles;
create policy "Users can read their diet profiles"
on public.diet_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profile_assignments pa
    where lower(pa.email) = lower(auth.jwt() ->> 'email')
      and pa.profile_id = diet_profiles.profile_id
      and pa.status = 'active'
  )
);

drop policy if exists "Users can insert their diet profiles" on public.diet_profiles;
create policy "Users can insert their diet profiles"
on public.diet_profiles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profile_assignments pa
    where lower(pa.email) = lower(auth.jwt() ->> 'email')
      and pa.profile_id = diet_profiles.profile_id
      and pa.status = 'active'
  )
);

drop policy if exists "Users can update their diet profiles" on public.diet_profiles;
create policy "Users can update their diet profiles"
on public.diet_profiles
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profile_assignments pa
    where lower(pa.email) = lower(auth.jwt() ->> 'email')
      and pa.profile_id = diet_profiles.profile_id
      and pa.status = 'active'
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profile_assignments pa
    where lower(pa.email) = lower(auth.jwt() ->> 'email')
      and pa.profile_id = diet_profiles.profile_id
      and pa.status = 'active'
  )
);

drop policy if exists "Users can delete their diet profiles" on public.diet_profiles;
create policy "Users can delete their diet profiles"
on public.diet_profiles
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profile_assignments pa
    where lower(pa.email) = lower(auth.jwt() ->> 'email')
      and pa.profile_id = diet_profiles.profile_id
      and pa.status = 'active'
  )
);
