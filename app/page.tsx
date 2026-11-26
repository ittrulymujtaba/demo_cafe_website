import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  activeSpecial,
  getCafe,
  openStatus,
  WEEKDAY_NAMES,
  type Cafe,
} from "@/lib/cafe";

// The demo café. Once there are multiple cafés, this comes from the request's host or path.
const CAFE_SLUG = "westward-coffee";

// Everything here is prerendered and cached (see getCafe). Only the parts that depend on
// the current time sit behind Suspense: the specials banner and the open/closed status.
export default async function Home() {
  const cafe = await getCafe(CAFE_SLUG);
  if (!cafe) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-xl font-semibold">Café not found</h1>
      </main>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <SpecialBanner cafe={cafe} />
      </Suspense>

      <Hero cafe={cafe} />

      <Suspense fallback={<HoursFallback />}>
        <HoursAndLocation cafe={cafe} />
      </Suspense>

      <Menu cafe={cafe} />
      <About cafe={cafe} />
      <Gallery cafe={cafe} />
      <Footer cafe={cafe} />
    </>
  );
}

async function SpecialBanner({ cafe }: { cafe: Cafe }) {
  await connection();
  const special = activeSpecial(cafe);
  if (!special) return null;
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
      {special.text}
    </div>
  );
}

function HoursFallback() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10">
      <h2 className="text-2xl font-semibold">Hours & location</h2>
    </section>
  );
}

function Hero({ cafe }: { cafe: Cafe }) {
  return (
    <header className="relative isolate">
      <div className="relative h-72 w-full overflow-hidden bg-stone-800 sm:h-96">
        {cafe.hero_image ? (
          <Image
            src={cafe.hero_image}
            alt={cafe.name}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
      </div>
      <div className="mx-auto -mt-16 max-w-2xl px-5 text-center text-white sm:-mt-20">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{cafe.name}</h1>
        {cafe.tagline && <p className="mt-2 text-lg text-stone-200">{cafe.tagline}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#menu"
            className="rounded-full bg-white px-6 py-3 font-semibold text-stone-900 hover:bg-stone-100"
          >
            View menu
          </a>
          {cafe.map_url && (
            <a
              href={cafe.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Get directions
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

async function HoursAndLocation({ cafe }: { cafe: Cafe }) {
  await connection();
  const status = openStatus(cafe);
  const hours = [...cafe.opening_hours].sort((a, b) => a.weekday - b.weekday);
  // Show Monday first, Sunday last.
  const ordered = [...hours.filter((h) => h.weekday !== 0), ...hours.filter((h) => h.weekday === 0)];

  return (
    <section className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold">Hours & location</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            status.label === "Open now"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-stone-200 text-stone-700"
          }`}
        >
          {status.label}
          {status.reason === "holiday" && status.note ? ` · ${status.note}` : ""}
        </span>
      </div>

      <ul className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {ordered.map((h) => {
          const isToday = h.weekday === status.today;
          return (
            <li
              key={h.weekday}
              className={`flex justify-between px-4 py-2 text-sm ${
                isToday ? "bg-amber-50 font-semibold" : ""
              }`}
            >
              <span>{WEEKDAY_NAMES[h.weekday]}</span>
              <span>
                {h.closed || !h.opens || !h.closes
                  ? "Closed"
                  : `${h.opens.slice(0, 5)}–${h.closes.slice(0, 5)}`}
              </span>
            </li>
          );
        })}
      </ul>

      {cafe.special_dates.length > 0 && (
        <div className="mt-4 text-sm text-stone-600">
          {cafe.special_dates
            .filter((d) => d.closed)
            .map((d) => (
              <p key={d.id}>
                Closed {formatDate(d.date)}
                {d.note ? ` (${d.note})` : ""}
              </p>
            ))}
        </div>
      )}

      {cafe.address && <p className="mt-6 text-stone-700">{cafe.address}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        {cafe.phone && (
          <a
            href={`tel:${cafe.phone.replace(/\s+/g, "")}`}
            className="rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Call {cafe.phone}
          </a>
        )}
        {cafe.map_url && (
          <a
            href={cafe.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-stone-300 px-5 py-2 text-sm font-semibold"
          >
            Directions
          </a>
        )}
      </div>

      {cafe.address && (
        <iframe
          title={`Map of ${cafe.name}`}
          className="mt-6 h-64 w-full rounded-xl border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(cafe.address)}&output=embed`}
        />
      )}
    </section>
  );
}

function Menu({ cafe }: { cafe: Cafe }) {
  return (
    <section id="menu" className="bg-stone-100 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold">Menu</h2>
        {cafe.menu_sections.map((section) => (
          <div key={section.id} className="mt-6">
            <h3 className="border-b border-stone-300 pb-1 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {section.name}
            </h3>
            <ul className="mt-2 space-y-3">
              {section.menu_items.map((item) => (
                <li
                  key={item.id}
                  className={`flex justify-between gap-4 ${item.sold_out ? "text-stone-400" : ""}`}
                >
                  <div>
                    <p className={`font-medium ${item.sold_out ? "line-through" : ""}`}>
                      {item.name}
                      {item.sold_out && (
                        <span className="ml-2 text-xs font-normal no-underline">Sold out</span>
                      )}
                    </p>
                    {item.description && (
                      <p className="text-sm text-stone-500">{item.description}</p>
                    )}
                  </div>
                  {item.price !== null && (
                    <p className="whitespace-nowrap font-medium">${item.price.toFixed(2)}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function About({ cafe }: { cafe: Cafe }) {
  if (!cafe.about) return null;
  return (
    <section className="mx-auto max-w-2xl px-5 py-10">
      <h2 className="text-2xl font-semibold">About</h2>
      <p className="mt-3 leading-relaxed text-stone-700">{cafe.about}</p>
    </section>
  );
}

function Gallery({ cafe }: { cafe: Cafe }) {
  if (cafe.gallery_images.length === 0) return null;
  return (
    <section className="mx-auto max-w-2xl px-5 pb-10">
      <h2 className="text-2xl font-semibold">Gallery</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cafe.gallery_images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-lg bg-stone-200">
            <Image
              src={img.url}
              alt=""
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer({ cafe }: { cafe: Cafe }) {
  const links = [
    { label: "Instagram", href: cafe.instagram_url },
    { label: "Facebook", href: cafe.facebook_url },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  return (
    <footer className="bg-stone-900 px-5 py-8 text-center text-sm text-stone-300">
      <p className="font-semibold text-white">{cafe.name}</p>
      {cafe.address && <p className="mt-1">{cafe.address}</p>}
      {links.length > 0 && (
        <nav className="mt-3 flex justify-center gap-4">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="underline">
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </footer>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
