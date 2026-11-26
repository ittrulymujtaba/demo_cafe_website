-- Café website schema.
-- weekday convention: 0 = Sunday … 6 = Saturday (matches Postgres extract(dow)).

create table cafes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  about text,
  phone text,
  address text,
  map_url text,
  instagram_url text,
  facebook_url text,
  hero_image text,
  timezone text not null default 'Pacific/Auckland'
);

create table cafe_admins (
  cafe_id uuid references cafes on delete cascade,
  user_id uuid references auth.users on delete cascade,
  primary key (cafe_id, user_id)
);

create table menu_sections (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes on delete cascade,
  name text not null,
  position int not null default 0
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references menu_sections on delete cascade,
  name text not null,
  description text,
  price numeric(6,2),
  sold_out boolean default false,
  position int not null default 0
);

create table opening_hours (
  cafe_id uuid references cafes on delete cascade,
  weekday int check (weekday between 0 and 6),
  opens time,
  closes time,
  closed boolean default false,
  primary key (cafe_id, weekday)
);

create table special_dates (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes on delete cascade,
  date date not null,
  note text,
  closed boolean default true
);

create table specials (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes on delete cascade,
  text text not null,
  starts_on date,
  ends_on date
);

create table gallery_images (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid references cafes on delete cascade,
  url text not null,
  position int not null default 0
);

create index on menu_sections (cafe_id, position);
create index on menu_items (section_id, position);
create index on special_dates (cafe_id, date);
create index on specials (cafe_id);
create index on gallery_images (cafe_id, position);
