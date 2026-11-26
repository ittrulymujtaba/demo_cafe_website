-- Row-level security.
-- Everyone can read. Only users listed in cafe_admins for a café can write
-- to that café's data. This is what lets the same schema host many cafés later.

-- Helper: is the current user an admin of this café?
create or replace function public.is_cafe_admin(p_cafe_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from cafe_admins
    where cafe_id = p_cafe_id and user_id = auth.uid()
  );
$$;

-- Helper: which café does a menu section belong to?
create or replace function public.section_cafe_id(p_section_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cafe_id from menu_sections where id = p_section_id;
$$;

alter table cafes enable row level security;
alter table cafe_admins enable row level security;
alter table menu_sections enable row level security;
alter table menu_items enable row level security;
alter table opening_hours enable row level security;
alter table special_dates enable row level security;
alter table specials enable row level security;
alter table gallery_images enable row level security;

-- Public read on all content tables.
create policy "public read cafes" on cafes for select using (true);
create policy "public read menu_sections" on menu_sections for select using (true);
create policy "public read menu_items" on menu_items for select using (true);
create policy "public read opening_hours" on opening_hours for select using (true);
create policy "public read special_dates" on special_dates for select using (true);
create policy "public read specials" on specials for select using (true);
create policy "public read gallery_images" on gallery_images for select using (true);

-- Admins can see which users administer their café (their own rows only).
create policy "admins read own admin rows" on cafe_admins for select
  using (user_id = auth.uid());

-- Writes: only café admins.
create policy "admins update cafes" on cafes for update
  using (public.is_cafe_admin(id)) with check (public.is_cafe_admin(id));

create policy "admins write menu_sections" on menu_sections for all
  using (public.is_cafe_admin(cafe_id)) with check (public.is_cafe_admin(cafe_id));

create policy "admins write menu_items" on menu_items for all
  using (public.is_cafe_admin(public.section_cafe_id(section_id)))
  with check (public.is_cafe_admin(public.section_cafe_id(section_id)));

create policy "admins write opening_hours" on opening_hours for all
  using (public.is_cafe_admin(cafe_id)) with check (public.is_cafe_admin(cafe_id));

create policy "admins write special_dates" on special_dates for all
  using (public.is_cafe_admin(cafe_id)) with check (public.is_cafe_admin(cafe_id));

create policy "admins write specials" on specials for all
  using (public.is_cafe_admin(cafe_id)) with check (public.is_cafe_admin(cafe_id));

create policy "admins write gallery_images" on gallery_images for all
  using (public.is_cafe_admin(cafe_id)) with check (public.is_cafe_admin(cafe_id));
