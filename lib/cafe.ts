import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";

// The demo café. Once there are multiple cafés, this comes from the request's host or path.
export const CAFE_SLUG = "westward-coffee";

// Public, read-only client. Row-level security lets anyone read; writes need an admin login.
export function publicSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. See .env.example.",
    );
  }
  return createClient(url, key);
}

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  sold_out: boolean;
  position: number;
};

export type MenuSection = {
  id: string;
  name: string;
  position: number;
  menu_items: MenuItem[];
};

export type OpeningHour = {
  weekday: number; // 0 = Sunday … 6 = Saturday
  opens: string | null; // "HH:MM:SS"
  closes: string | null;
  closed: boolean;
};

export type SpecialDate = { id: string; date: string; note: string | null; closed: boolean };
export type Special = { id: string; text: string; starts_on: string | null; ends_on: string | null };
export type GalleryImage = { id: string; url: string; position: number };

export type Cafe = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  about: string | null;
  phone: string | null;
  address: string | null;
  map_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  hero_image: string | null;
  timezone: string;
  is_demo: boolean;
  menu_sections: MenuSection[];
  opening_hours: OpeningHour[];
  special_dates: SpecialDate[];
  specials: Special[];
  gallery_images: GalleryImage[];
};

// Cached per café. Saves in the admin call updateTag("cafes"), so the page refreshes straight away.
// Every café shares the "cafes" tag, so any save (or the nightly demo reset) refreshes them.
// The cache also goes stale after a minute, so the nightly reset appears even though
// the cron job can't call revalidation itself.
export async function getCafe(slug: string): Promise<Cafe | null> {
  "use cache";
  cacheTag("cafes", `cafe:${slug}`);
  cacheLife({ revalidate: 60, expire: 3600 });

  const { data, error } = await publicSupabase()
    .from("cafes")
    .select(
      `*,
       menu_sections(*, menu_items(*)),
       opening_hours(*),
       special_dates(*),
       specials(*),
       gallery_images(*)`,
    )
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }

  const cafe = data as Cafe;
  cafe.menu_sections.sort((a, b) => a.position - b.position);
  cafe.menu_sections.forEach((s) => s.menu_items.sort((a, b) => a.position - b.position));
  cafe.gallery_images.sort((a, b) => a.position - b.position);
  return cafe;
}

// --- Time helpers, evaluated in the café's own timezone (not the server's) ---

function partsIn(timezone: string, now: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`; // YYYY-MM-DD
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  const minutes = Number(p.hour) * 60 + Number(p.minute);
  return { date, weekday, minutes };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export type OpenStatus = {
  label: "Open now" | "Closed";
  reason: "open" | "hours" | "holiday" | "closed-day";
  note?: string;
  todayHours?: string; // e.g. "07:30–15:00"
  today: number; // weekday index
};

export function openStatus(cafe: Cafe, now = new Date()): OpenStatus {
  const { date, weekday, minutes } = partsIn(cafe.timezone, now);

  const holiday = cafe.special_dates.find((d) => d.date === date);
  if (holiday && holiday.closed) {
    return { label: "Closed", reason: "holiday", note: holiday.note ?? "Closed today", today: weekday };
  }

  const hours = cafe.opening_hours.find((h) => h.weekday === weekday);
  if (!hours || hours.closed || !hours.opens || !hours.closes) {
    return { label: "Closed", reason: "closed-day", today: weekday };
  }

  const todayHours = `${hours.opens.slice(0, 5)}–${hours.closes.slice(0, 5)}`;
  const open = toMinutes(hours.opens) <= minutes && minutes < toMinutes(hours.closes);
  return open
    ? { label: "Open now", reason: "open", todayHours, today: weekday }
    : { label: "Closed", reason: "hours", todayHours, today: weekday };
}

export function activeSpecial(cafe: Cafe, now = new Date()): Special | null {
  const { date } = partsIn(cafe.timezone, now);
  return (
    cafe.specials.find(
      (s) => (!s.starts_on || s.starts_on <= date) && (!s.ends_on || date <= s.ends_on),
    ) ?? null
  );
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
