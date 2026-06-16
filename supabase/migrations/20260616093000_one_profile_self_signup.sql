delete from public.profile_assignments
where profile_id <> 'agnieszka';

delete from public.diet_profiles
where profile_id <> 'agnieszka';

alter table public.profile_assignments
drop constraint if exists profile_assignments_profile_id_check;

alter table public.profile_assignments
add constraint profile_assignments_profile_id_check
check (profile_id = 'agnieszka');

alter table public.diet_profiles
drop constraint if exists diet_profiles_profile_id_check;

alter table public.diet_profiles
add constraint diet_profiles_profile_id_check
check (profile_id = 'agnieszka');

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
