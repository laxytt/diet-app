alter table public.diet_profiles
add column if not exists revision bigint not null default 0;

insert into public.profile_assignments (email, profile_id, name, updated_at)
values ('laxytt@gmail.com', 'agnieszka', 'Agnieszka', now())
on conflict (email)
do update set profile_id = excluded.profile_id, name = excluded.name, updated_at = now();

insert into public.diet_profiles (user_id, profile_id, name, data, revision, updated_at)
values (
  '0cf2f59c-1c01-4e25-96fb-bafcd0e264c9'::uuid,
  'agnieszka',
  'Agnieszka',
  '{}'::jsonb,
  0,
  now()
)
on conflict (user_id, profile_id) do nothing;

with profile_rows as (
  select user_id, profile_id, name, data, updated_at
  from public.diet_profiles
  where profile_id = 'agnieszka'
),
canonical as (
  select data
  from profile_rows
  where user_id = '0cf2f59c-1c01-4e25-96fb-bafcd0e264c9'::uuid
  limit 1
),
entries as (
  select coalesce(jsonb_agg(entry order by entry->>'date', entry->>'createdAt'), '[]'::jsonb) as value
  from (
    select distinct on (entry->>'id') entry
    from profile_rows
    cross join lateral jsonb_array_elements(coalesce(data->'entries', '[]'::jsonb)) entry
    where coalesce(entry->>'id', '') <> ''
    order by entry->>'id', updated_at desc
  ) merged_entries
),
foods as (
  select coalesce(jsonb_agg(food order by lower(coalesce(food->>'name', ''))), '[]'::jsonb) as value
  from (
    select distinct on (coalesce(nullif(food->>'id', ''), lower(coalesce(food->>'name', '')))) food
    from profile_rows
    cross join lateral jsonb_array_elements(coalesce(data->'foods', '[]'::jsonb)) food
    where coalesce(nullif(food->>'id', ''), lower(coalesce(food->>'name', ''))) <> ''
    order by coalesce(nullif(food->>'id', ''), lower(coalesce(food->>'name', ''))), updated_at desc
  ) merged_foods
),
weights as (
  select coalesce(jsonb_agg(weight order by weight->>'date'), '[]'::jsonb) as value
  from (
    select distinct on (weight->>'date') weight
    from profile_rows
    cross join lateral jsonb_array_elements(coalesce(data->'weights', '[]'::jsonb)) weight
    where coalesce(weight->>'date', '') <> ''
    order by weight->>'date', updated_at desc
  ) merged_weights
),
water as (
  select coalesce(jsonb_agg(water order by water->>'date'), '[]'::jsonb) as value
  from (
    select distinct on (water->>'date') water
    from profile_rows
    cross join lateral jsonb_array_elements(coalesce(data->'water', '[]'::jsonb)) water
    where coalesce(water->>'date', '') <> ''
    order by water->>'date', updated_at desc
  ) merged_water
),
daily_coach as (
  select coalesce(jsonb_object_agg(key, value order by updated_at), '{}'::jsonb) as value
  from profile_rows
  cross join lateral jsonb_each(coalesce(data->'dailyCoach', '{}'::jsonb))
),
deleted_entries as (
  select coalesce(jsonb_agg(id order by id), '[]'::jsonb) as value
  from (
    select distinct id
    from profile_rows
    cross join lateral jsonb_array_elements_text(coalesce(data->'deletedEntryIds', '[]'::jsonb)) id
    where id <> ''
  ) deleted
),
merged as (
  select jsonb_build_object(
    'version', coalesce((select data->'version' from canonical), '1'::jsonb),
    'settings', coalesce((select data->'settings' from canonical), '{}'::jsonb),
    'foods', (select value from foods),
    'entries', (select value from entries),
    'weights', (select value from weights),
    'water', (select value from water),
    'dailyCoach', (select value from daily_coach),
    'deletedEntryIds', (select value from deleted_entries)
  ) as data
)
update public.diet_profiles
set
  name = 'Agnieszka',
  data = merged.data,
  revision = greatest(public.diet_profiles.revision, 0) + 1,
  updated_at = now()
from merged
where user_id = '0cf2f59c-1c01-4e25-96fb-bafcd0e264c9'::uuid
  and profile_id = 'agnieszka';

delete from public.diet_profiles
where user_id <> '0cf2f59c-1c01-4e25-96fb-bafcd0e264c9'::uuid
   or profile_id <> 'agnieszka';

delete from public.profile_assignments
where lower(email) <> 'laxytt@gmail.com'
   or profile_id <> 'agnieszka';

drop policy if exists "Users can insert their profile assignment" on public.profile_assignments;
drop policy if exists "Users can update their profile assignment" on public.profile_assignments;

drop policy if exists "Users can read their profile assignment" on public.profile_assignments;
create policy "Users can read their profile assignment"
on public.profile_assignments
for select
to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));
