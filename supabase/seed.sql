-- Demo café seed data. Safe to re-run.
--
-- The café row is updated in place (never deleted), so cafe_admins links and the
-- hero photo survive a re-run. Menu, hours and specials are replaced each time.
-- Gallery photos are only added if the café has none, so uploaded photos are kept.
-- The nightly reset job can run this same file.

insert into cafes (slug, name, tagline, about, phone, address, map_url,
                   instagram_url, facebook_url, timezone, is_demo)
values (
  'westward-coffee',
  'Westward Coffee',
  'Slow mornings, strong flat whites.',
  'Westward is a small neighbourhood café in West Auckland, roasting beans in-house and baking a fresh batch of something every morning. Come early for the croissants.',
  '+64 9 555 0142',
  'West Auckland, New Zealand',
  'https://maps.google.com/?q=West+Auckland+New+Zealand',
  'https://instagram.com/westwardcoffee',
  'https://facebook.com/westwardcoffee',
  'Pacific/Auckland',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  about = excluded.about,
  phone = excluded.phone,
  address = excluded.address,
  map_url = excluded.map_url,
  instagram_url = excluded.instagram_url,
  facebook_url = excluded.facebook_url,
  timezone = excluded.timezone,
  is_demo = excluded.is_demo;

-- Replace the menu, hours and specials with the demo versions.
delete from menu_sections where cafe_id = (select id from cafes where slug = 'westward-coffee');
delete from opening_hours where cafe_id = (select id from cafes where slug = 'westward-coffee');
delete from specials where cafe_id = (select id from cafes where slug = 'westward-coffee');

insert into menu_sections (cafe_id, name, position)
select c.id, s.name, s.position
from cafes c
cross join (values
  ('Coffee', 0),
  ('Tea', 1),
  ('Brunch', 2),
  ('Cabinet food', 3),
  ('Cold drinks', 4),
  ('Kids', 5)
) as s(name, position)
where c.slug = 'westward-coffee';

insert into menu_items (section_id, name, description, price, sold_out, position)
select ms.id, i.name, i.description, i.price, i.sold_out, i.position
from menu_sections ms
join cafes c on c.id = ms.cafe_id
join (values
  -- Coffee
  ('Coffee', 'Espresso', 'Single shot, served with a sweet', 3.80, false, 0),
  ('Coffee', 'Piccolo', 'Small milky espresso, ristretto base', 4.20, false, 1),
  ('Coffee', 'Flat white', 'Double shot, velvety milk', 5.00, false, 2),
  ('Coffee', 'Cappuccino', 'Equal parts espresso, milk and foam', 4.80, false, 3),
  ('Coffee', 'Long black', 'Espresso over hot water', 4.50, false, 4),
  ('Coffee', 'Mocha', 'Espresso, dark chocolate, steamed milk', 5.50, false, 5),
  ('Coffee', 'Batch brew', 'Rotating single-origin filter', 4.00, true, 6),
  -- Tea
  ('Tea', 'English breakfast', 'Loose leaf, strong and bright', 4.00, false, 0),
  ('Tea', 'Earl grey', 'Bergamot, loose leaf', 4.00, false, 1),
  ('Tea', 'Chai latte', 'Spiced chai with steamed milk', 5.00, false, 2),
  ('Tea', 'Matcha latte', 'Ceremonial-grade matcha, oat or dairy milk', 5.50, false, 3),
  -- Brunch
  ('Brunch', 'Avocado toast', 'Sourdough, smashed avocado, chilli, seeds', 16.00, false, 0),
  ('Brunch', 'Eggs on sourdough', 'Two eggs your way, bacon, greens', 17.50, false, 1),
  ('Brunch', 'Shakshuka', 'Baked eggs in spiced tomato, feta, grilled bread', 18.50, true, 2),
  ('Brunch', 'The big breakfast', 'Eggs, bacon, sausage, mushrooms, hash brown, toast', 22.00, false, 3),
  -- Cabinet food
  ('Cabinet food', 'Butter croissant', 'Baked fresh each morning', 4.50, false, 0),
  ('Cabinet food', 'Almond croissant', 'Filled with frangipane, flaked almonds', 5.50, false, 1),
  ('Cabinet food', 'Banana bread', 'Slice, served warm with butter', 5.50, false, 2),
  ('Cabinet food', 'Chocolate brownie', 'Dense, fudgy, gluten free', 4.80, false, 3),
  ('Cabinet food', 'Flapjack', 'Oats, golden syrup, a little salt', 4.00, false, 4),
  -- Cold drinks
  ('Cold drinks', 'Iced latte', 'Espresso, cold milk, ice', 6.00, false, 0),
  ('Cold drinks', 'Iced long black', 'Espresso, cold water, ice', 5.00, false, 1),
  ('Cold drinks', 'Lemon and ginger soda', 'House-made, lightly sparkling', 5.00, false, 2),
  ('Cold drinks', 'Fresh orange juice', 'Pressed to order', 6.50, false, 3),
  -- Kids
  ('Kids', 'Hot chocolate', 'Made with real chocolate', 4.00, false, 0),
  ('Kids', 'Babyccino', 'Frothed milk with a sprinkle of cocoa', 2.00, false, 1),
  ('Kids', 'Kids milkshake', 'Vanilla, chocolate or strawberry', 5.00, false, 2)
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

-- Gallery: only added when the café has no photos yet, so uploads are kept.
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
where c.slug = 'westward-coffee'
  and not exists (select 1 from gallery_images gi where gi.cafe_id = c.id);

insert into specials (cafe_id, text, starts_on, ends_on)
select id, 'Free upgrade to oat milk all week', current_date, current_date + 7
from cafes where slug = 'westward-coffee';
