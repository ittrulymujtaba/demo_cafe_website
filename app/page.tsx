import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  activeSpecial,
  CAFE_SLUG,
  getCafe,
  openStatus,
  WEEKDAY_NAMES,
  type Cafe,
} from "@/lib/cafe";

// Everything here is prerendered and cached (see getCafe). Only the parts that depend on
// the current time sit behind Suspense: the specials banner and the open/closed status.
// Those run per request, so "Open now" is always worked out for the café's own timezone (NZ).
export default async function Home() {
  const cafe = await getCafe(CAFE_SLUG);
  if (!cafe) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-2xl font-semibold">Café not found</h1>
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
    <div className="bg-latte px-4 py-2 text-center text-sm font-medium text-espresso">
      {special.text}
    </div>
  );
}

function HoursFallback() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-12">
      <h2 className="text-3xl font-semibold">Hours &amp; location</h2>
    </section>
  );
}

function Hero({ cafe }: { cafe: Cafe }) {
  return (
    <header className="relative isolate h-[28rem] w-full overflow-hidden bg-espresso sm:h-[34rem]">
      {cafe.hero_image ? (
        <Image
          src={cafe.hero_image}
          alt={cafe.name}
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/30 to-espresso/10" />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl px-5 pb-12 text-center text-cream">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-latte">West Auckland</p>
        <h1 className="mt-2 text-5xl font-semibold leading-tight sm:text-6xl">{cafe.name}</h1>
        {cafe.tagline && <p className="mt-3 text-lg text-latte">{cafe.tagline}</p>}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#menu"
            className="rounded-full bg-coffee px-7 py-3 font-semibold text-cream shadow-lg hover:bg-espresso"
          >
            View menu
          </a>
          {cafe.map_url && (
            <a
              href={cafe.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-cream/70 px-7 py-3 font-semibold text-cream hover:bg-cream/10"
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
    <section className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-semibold">Hours &amp; location</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            status.label === "Open now" ? "bg-coffee text-cream" : "bg-latte text-espresso/70"
          }`}
        >
          {status.label}
          {status.reason === "holiday" && status.note ? ` · ${status.note}` : ""}
        </span>
      </div>

      <ul className="mt-5 divide-y divide-espresso/10 overflow-hidden rounded-2xl border border-espresso/10 bg-white/60">
        {ordered.map((h) => {
          const isToday = h.weekday === status.today;
          return (
            <li
              key={h.weekday}
              className={`flex justify-between px-4 py-3 text-sm ${
                isToday ? "bg-latte font-semibold" : ""
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

      {cafe.special_dates.some((d) => d.closed) && (
        <div className="mt-4 text-sm text-espresso/70">
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

      {cafe.address && <p className="mt-6 text-lg">{cafe.address}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        {cafe.phone && (
          <a
            href={`tel:${cafe.phone.replace(/\s+/g, "")}`}
            className="rounded-full bg-coffee px-5 py-2.5 text-sm font-semibold text-cream"
          >
            Call {cafe.phone}
          </a>
        )}
        {cafe.map_url && (
          <a
            href={cafe.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-coffee px-5 py-2.5 text-sm font-semibold text-coffee"
          >
            Directions
          </a>
        )}
      </div>

      {cafe.address && (
        // Centred on the wider area at a zoom that shows the suburb, not a pin on a real building.
        <iframe
          title={`Map of the area around ${cafe.name}`}
          className="mt-6 h-64 w-full rounded-2xl border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${encodeURIComponent(cafe.address)}&z=12&output=embed`}
        />
      )}
    </section>
  );
}

function Menu({ cafe }: { cafe: Cafe }) {
  return (
    <section id="menu" className="bg-latte/60 px-5 py-14">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-semibold">Menu</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {cafe.menu_sections.map((section) => (
            <a key={section.id} href={`#section-${section.id}`} className="text-coffee underline-offset-4 hover:underline">
              {section.name}
            </a>
          ))}
        </div>

        {cafe.menu_sections.map((section) => (
          <div key={section.id} id={`section-${section.id}`} className="mt-10 scroll-mt-6">
            <h3 className="font-display text-2xl font-semibold text-coffee">{section.name}</h3>
            <ul className="mt-4 space-y-5">
              {section.menu_items.map((item) => (
                <li
                  key={item.id}
                  className={`flex justify-between gap-4 ${item.sold_out ? "opacity-50" : ""}`}
                >
                  <div>
                    <p className={`font-medium ${item.sold_out ? "line-through" : ""}`}>
                      {item.name}
                      {item.sold_out && (
                        <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-terracotta no-underline">
                          Sold out
                        </span>
                      )}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 text-sm text-espresso/65">{item.description}</p>
                    )}
                  </div>
                  {item.price !== null && (
                    <p className="whitespace-nowrap font-medium text-coffee">${item.price.toFixed(2)}</p>
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
    <section className="mx-auto max-w-2xl px-5 py-14">
      <h2 className="text-3xl font-semibold">About</h2>
      <p className="mt-4 text-lg leading-relaxed text-espresso/80">{cafe.about}</p>
    </section>
  );
}

function Gallery({ cafe }: { cafe: Cafe }) {
  if (cafe.gallery_images.length === 0) return null;
  return (
    <section className="mx-auto max-w-2xl px-5 pb-14">
      <h2 className="text-3xl font-semibold">Gallery</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cafe.gallery_images.map((img) => (
          <div key={img.id} className="relative aspect-square overflow-hidden rounded-2xl bg-latte">
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
    <footer className="bg-espresso px-5 py-10 text-center text-sm text-cream/80">
      <p className="font-display text-xl font-semibold text-cream">{cafe.name}</p>
      {cafe.address && <p className="mt-1">{cafe.address}</p>}
      {links.length > 0 && (
        <nav className="mt-4 flex justify-center gap-5">
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
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
