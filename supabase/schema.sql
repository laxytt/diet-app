create table if not exists public.profile_assignments (
  email text primary key,
  profile_id text not null check (profile_id = 'agnieszka'),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diet_profiles (
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null check (profile_id = 'agnieszka'),
  name text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);

alter table public.profile_assignments enable row level security;
alter table public.diet_profiles enable row level security;

drop policy if exists "Users can read their profile assignment" on public.profile_assignments;
create policy "Users can read their profile assignment"
on public.profile_assignments
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Users can insert their profile assignment" on public.profile_assignments;
create policy "Users can insert their profile assignment"
on public.profile_assignments
for insert
to authenticated
with check (
  lower(email) = lower(auth.jwt() ->> 'email')
  and profile_id = 'agnieszka'
);

drop policy if exists "Users can update their profile assignment" on public.profile_assignments;
create policy "Users can update their profile assignment"
on public.profile_assignments
for update
to authenticated
using (
  lower(email) = lower(auth.jwt() ->> 'email')
  and profile_id = 'agnieszka'
)
with check (
  lower(email) = lower(auth.jwt() ->> 'email')
  and profile_id = 'agnieszka'
);

drop policy if exists "Users can read their diet profiles" on public.diet_profiles;
create policy "Users can read their diet profiles"
on public.diet_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  and profile_id = (
    select profile_id
    from public.profile_assignments
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Users can insert their diet profiles" on public.diet_profiles;
create policy "Users can insert their diet profiles"
on public.diet_profiles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and profile_id = (
    select profile_id
    from public.profile_assignments
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Users can update their diet profiles" on public.diet_profiles;
create policy "Users can update their diet profiles"
on public.diet_profiles
for update
to authenticated
using (
  auth.uid() = user_id
  and profile_id = (
    select profile_id
    from public.profile_assignments
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
)
with check (
  auth.uid() = user_id
  and profile_id = (
    select profile_id
    from public.profile_assignments
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);

drop policy if exists "Users can delete their diet profiles" on public.diet_profiles;
create policy "Users can delete their diet profiles"
on public.diet_profiles
for delete
to authenticated
using (
  auth.uid() = user_id
  and profile_id = (
    select profile_id
    from public.profile_assignments
    where lower(email) = lower(auth.jwt() ->> 'email')
  )
);
