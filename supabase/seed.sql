-- Demo café seed data. Safe to re-run: clears the demo café first.
-- The nightly reset job can run this same file.

delete from cafes where slug = 'westward-coffee';

insert into cafes (slug, name, tagline, about, phone, address, map_url,
                   instagram_url, facebook_url, hero_image, timezone)
values (
  'westward-coffee',
  'Westward Coffee',
  'Slow mornings, strong flat whites.',
  'Westward is a small neighbourhood café roasting beans in-house and baking a fresh batch of something every morning. Come early for the croissants.',
  '+64 9 555 0142',
  '18 Harbour Lane, Eastbay',
  'https://maps.google.com/?q=Westward+Coffee',
  'https://instagram.com/westwardcoffee',
  'https://facebook.com/westwardcoffee',
  null,
  'Pacific/Auckland'
);

-- Menu sections and items, looked up by name so the seed stays readable.
insert into menu_sections (cafe_id, name, position)
select c.id, s.name, s.position
from cafes c
cross join (values ('Coffee', 0), ('Food', 1), ('Cold drinks', 2)) as s(name, position)
where c.slug = 'westward-coffee';

insert into menu_items (section_id, name, description, price, sold_out, position)
select ms.id, i.name, i.description, i.price, i.sold_out, i.position
from menu_sections ms
join cafes c on c.id = ms.cafe_id
join (values
  ('Coffee', 'Flat white', 'Double shot, velvety milk', 5.00, false, 0),
  ('Coffee', 'Long black', 'Espresso over hot water', 4.50, false, 1),
  ('Coffee', 'Cappuccino', 'Equal parts espresso, milk and foam', 4.80, false, 2),
  ('Coffee', 'Batch brew', 'Rotating single-origin filter', 4.00, true, 3),
  ('Food', 'Butter croissant', 'Baked fresh each morning', 4.50, false, 0),
  ('Food', 'Avocado toast', 'Sourdough, smashed avocado, chilli, seeds', 16.00, false, 1),
  ('Food', 'Banana bread', 'Slice, served warm with butter', 5.50, false, 2),
  ('Cold drinks', 'Iced latte', 'Espresso, cold milk, ice', 6.00, false, 0),
  ('Cold drinks', 'Lemon and ginger soda', 'House-made, lightly sparkling', 5.00, false, 1)
) as i(section, name, description, price, sold_out, position)
  on i.section = ms.name
where c.slug = 'westward-coffee';

-- Hours: 0 = Sunday … 6 = Saturday.
insert into opening_hours (cafe_id, weekday, opens, closes, closed)
select c.id, h.weekday, h.opens, h.closes, h.closed
from cafes c
cross join (values
  (0, null::time, null::time, true),
  (1, '07:30'::time, '15:00'::time, false),
  (2, '07:30'::time, '15:00'::time, false),
  (3, '07:30'::time, '15:00'::time, false),
  (4, '07:30'::time, '15:00'::time, false),
  (5, '07:30'::time, '15:00'::time, false),
  (6, '08:00'::time, '14:00'::time, false)
) as h(weekday, opens, closes, closed)
where c.slug = 'westward-coffee';

insert into gallery_images (cafe_id, url, position)
select c.id, g.url, g.position
from cafes c
cross join (values
  ('https://placehold.co/800x600?text=Gallery+1', 0),
  ('https://placehold.co/800x600?text=Gallery+2', 1),
  ('https://placehold.co/800x600?text=Gallery+3', 2),
  ('https://placehold.co/800x600?text=Gallery+4', 3),
  ('https://placehold.co/800x600?text=Gallery+5', 4),
  ('https://placehold.co/800x600?text=Gallery+6', 5)
) as g(url, position)
where c.slug = 'westward-coffee';

insert into specials (cafe_id, text, starts_on, ends_on)
select id, 'Free upgrade to oat milk all week', current_date, current_date + 7
from cafes where slug = 'westward-coffee';
