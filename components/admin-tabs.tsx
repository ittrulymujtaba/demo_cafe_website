"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Menu" },
  { href: "/admin/hours", label: "Hours" },
  { href: "/admin/specials", label: "Specials" },
  { href: "/admin/details", label: "Details" },
  { href: "/admin/photos", label: "Photos" },
];

// Highlights the tab for the page you're on. "Menu" is only active on /admin itself,
// not on the other tabs, which are all under /admin/.
export default function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 mt-4 flex flex-wrap gap-2 text-sm">
      {tabs.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 font-medium ${
              active
                ? "border-coffee bg-coffee text-cream"
                : "border-espresso/20 bg-white/70 hover:bg-latte"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
