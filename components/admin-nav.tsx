import Link from "next/link";

const links = [
  { href: "/admin", label: "Menu" },
  { href: "/admin/hours", label: "Hours" },
  { href: "/admin/specials", label: "Specials" },
  { href: "/admin/details", label: "Details" },
  { href: "/admin/photos", label: "Photos" },
];

// Section tabs shown at the top of every admin page. Wraps on small screens.
export function AdminNav() {
  return (
    <nav className="-mx-1 mt-4 flex flex-wrap gap-2 text-sm">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-full border border-espresso/20 bg-white/70 px-3 py-1.5 font-medium hover:bg-latte"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function NoAccess() {
  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <h1 className="font-display text-2xl font-semibold">No access</h1>
      <p className="mt-3 text-espresso/80">
        This login isn&apos;t set up as an admin for this café. Ask the site owner to add you.
      </p>
    </main>
  );
}

// Shared input styling for admin forms.
export const adminInput =
  "w-full rounded-lg border border-espresso/20 bg-white px-3 py-2 text-base";
export const adminButton = "rounded-lg bg-coffee px-4 py-2 text-sm font-semibold text-cream";
export const adminGhostButton =
  "rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm font-medium";
export const adminDangerButton = "rounded-lg px-3 py-2 text-sm font-medium text-terracotta";
