create table if not exists public.profile_assignments (
  email text primary key,
  profile_id text not null check (profile_id in ('wiktor', 'magda', 'agnieszka')),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.profile_assignments (email, profile_id, name, updated_at)
values
  ('laxytt@gmail.com', 'agnieszka', 'Agnieszka', now())
on conflict (email)
do update set profile_id = excluded.profile_id, name = excluded.name, updated_at = now();

alter table public.profile_assignments enable row level security;

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
