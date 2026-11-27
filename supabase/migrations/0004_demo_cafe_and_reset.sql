-- Demo café: a separate copy of the main café that the demo login can edit.
-- Public edits to the demo can't touch the real site, and a nightly job resets it.
--
-- Main café slug: 'westward-coffee' (the owner's café). Demo café slug: 'westward-demo'.
-- Run after 0003. Then link the demo login to the demo café (see the setup notes).

-- 1. Create the demo café as a copy of the main café. Does nothing if it already exists.
insert into cafes (slug, name, tagline, about, phone, address, map_url,
                   instagram_url, facebook_url, hero_image, timezone, is_demo)
select 'westward-demo', name, tagline, about, phone, address, map_url,
       instagram_url, facebook_url, hero_image, timezone, true
from cafes
where slug = 'westward-coffee'
on conflict (slug) do nothing;

-- 2. Reset: copy the main café's content into the demo café.
--    Called by the nightly cron job (no logged-in user) or by the demo's "Reset demo" button.
--    A logged-in caller must be an admin of the demo café.
create or replace function reset_demo_cafe()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  src uuid := (select id from cafes where slug = 'westward-coffee');
  dst uuid := (select id from cafes where slug = 'westward-demo');
begin
  if src is null or dst is null then
    raise exception 'Main or demo café is missing';
  end if;

  -- Logged-in callers may only reset the demo café they administer.
  if auth.uid() is not null and not public.is_cafe_admin(dst) then
    raise exception 'Not allowed to reset this café';
  end if;

  -- Copy details
  update cafes d set
    name = s.name, tagline = s.tagline, about = s.about,
    phone = s.phone, address = s.address, map_url = s.map_url,
    instagram_url = s.instagram_url, facebook_url = s.facebook_url,
    hero_image = s.hero_image
  from cafes s
  where s.id = src and d.id = dst;

  -- Wipe demo data (menu items cascade with their sections)
  delete from menu_sections where cafe_id = dst;
  delete from opening_hours where cafe_id = dst;
  delete from special_dates where cafe_id = dst;
  delete from specials where cafe_id = dst;
  delete from gallery_images where cafe_id = dst;

  -- Copy menu: sections first, then items mapped to the new section ids by name
  with new_sections as (
    insert into menu_sections (cafe_id, name, position)
    select dst, name, position from menu_sections where cafe_id = src
    returning id, name
  )
  insert into menu_items (section_id, name, description, price, sold_out, position)
  select ns.id, i.name, i.description, i.price, i.sold_out, i.position
  from menu_items i
  join menu_sections s on s.id = i.section_id and s.cafe_id = src
  join new_sections ns on ns.name = s.name;

  insert into opening_hours (cafe_id, weekday, opens, closes, closed)
  select dst, weekday, opens, closes, closed from opening_hours where cafe_id = src;

  insert into special_dates (cafe_id, date, note, closed)
  select dst, date, note, closed from special_dates where cafe_id = src;

  insert into specials (cafe_id, text, starts_on, ends_on)
  select dst, text, starts_on, ends_on from specials where cafe_id = src;

  insert into gallery_images (cafe_id, url, position)
  select dst, url, position from gallery_images where cafe_id = src;
end;
$$;

-- Nobody who is logged out can run it. Logged-in admins can (the function checks which café).
revoke execute on function reset_demo_cafe() from public, anon;
grant execute on function reset_demo_cafe() to authenticated;

-- 3. Lock photo uploads out of the demo café at the storage level.
drop policy if exists "admins upload cafe photos" on storage.objects;
create policy "admins upload cafe photos" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cafe-photos'
    and public.is_cafe_admin(((storage.foldername(name))[1])::uuid)
    and not exists (
      select 1 from cafes c
      where c.id = ((storage.foldername(name))[1])::uuid
        and c.slug = 'westward-demo'
    )
  );

-- 4. Nightly reset at 14:00 UTC (3am NZ in summer).
--    Needs the pg_cron extension turned on in Supabase (Database → Extensions).
create extension if not exists pg_cron with schema extensions;

select cron.schedule(
  'reset-demo-cafe',
  '0 14 * * *',
  $$ select reset_demo_cafe(); $$
);
