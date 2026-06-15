create table if not exists public.diet_profiles (
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id text not null check (profile_id in ('wiktor', 'magda', 'agnieszka')),
  name text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, profile_id)
);

alter table public.diet_profiles enable row level security;

drop policy if exists "Users can read their diet profiles" on public.diet_profiles;
create policy "Users can read their diet profiles"
on public.diet_profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their diet profiles" on public.diet_profiles;
create policy "Users can insert their diet profiles"
on public.diet_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their diet profiles" on public.diet_profiles;
create policy "Users can update their diet profiles"
on public.diet_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their diet profiles" on public.diet_profiles;
create policy "Users can delete their diet profiles"
on public.diet_profiles
for delete
to authenticated
using (auth.uid() = user_id);
