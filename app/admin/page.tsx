import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import ConfirmSubmit from "@/components/confirm-submit";
import { requireAdmin } from "@/lib/admin-auth";
import {
  addItem,
  addSection,
  deleteItem,
  deleteSection,
  moveItem,
  moveSection,
  renameSection,
  saveItem,
  signOut,
  toggleSoldOut,
} from "./actions";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  sold_out: boolean;
  position: number;
};
type Section = { id: string; name: string; position: number; menu_items: Item[] };

const input =
  "w-full rounded-lg border border-espresso/20 bg-white px-3 py-2 text-base";
const smallButton =
  "rounded-lg border border-espresso/20 bg-white px-3 py-2 text-sm font-medium active:bg-cream";
const primaryButton = "rounded-lg bg-coffee px-4 py-2 text-sm font-semibold text-cream";
const dangerButton = "rounded-lg px-3 py-2 text-sm font-medium text-terracotta";

// The shell prerenders; the editor loads per request for the signed-in user.
export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-6 text-espresso/70">Loading menu…</p>}>
      <AdminEditor />
    </Suspense>
  );
}

async function AdminEditor() {
  await connection();
  const { sb, allowed, cafeName, cafeId } = await requireAdmin();

  if (!allowed || !cafeId) {
    return (
      <main className="mx-auto max-w-md px-5 py-10">
        <h1 className="font-display text-2xl font-semibold">No access</h1>
        <p className="mt-3 text-espresso/80">
          This login isn&apos;t set up as an admin for {cafeName}. Ask the site owner to add you.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className={smallButton}>
            Sign out
          </button>
        </form>
      </main>
    );
  }

  const { data: cafe } = await sb
    .from("cafes")
    .select("name, menu_sections(id, name, position, menu_items(id, name, description, price, sold_out, position))")
    .eq("id", cafeId)
    .single();

  const sections = ((cafe?.menu_sections ?? []) as Section[])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      ...s,
      menu_items: s.menu_items.slice().sort((a, b) => a.position - b.position),
    }));

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Menu</h1>
          <p className="text-sm text-espresso/70">{cafe?.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className={smallButton}>
            View site
          </Link>
          <form action={signOut}>
            <button type="submit" className={smallButton}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <p className="mt-4 text-sm text-espresso/70">
        Changes go live on the website within a few seconds.
      </p>

      <div className="mt-6 space-y-8">
        {sections.map((section, sIdx) => (
          <section key={section.id} className="rounded-2xl border border-espresso/10 bg-white/60 p-4">
            {/* Section header: rename, reorder, delete */}
            <div className="flex flex-wrap items-center gap-2">
              <form action={renameSection} className="flex flex-1 gap-2">
                <input type="hidden" name="id" value={section.id} />
                <input name="name" defaultValue={section.name} className={input} aria-label="Section name" />
                <button type="submit" className={smallButton}>
                  Save
                </button>
              </form>
              <form action={moveSection}>
                <input type="hidden" name="id" value={section.id} />
                <button name="dir" value="up" disabled={sIdx === 0} className={smallButton} aria-label="Move section up">
                  ↑
                </button>
              </form>
              <form action={moveSection}>
                <input type="hidden" name="id" value={section.id} />
                <button
                  name="dir"
                  value="down"
                  disabled={sIdx === sections.length - 1}
                  className={smallButton}
                  aria-label="Move section down"
                >
                  ↓
                </button>
              </form>
              <form action={deleteSection}>
                <input type="hidden" name="id" value={section.id} />
                <ConfirmSubmit
                  message={`Delete the whole "${section.name}" section and all its items?`}
                  className={dangerButton}
                >
                  Delete section
                </ConfirmSubmit>
              </form>
            </div>

            {/* Items */}
            <ul className="mt-4 space-y-4">
              {section.menu_items.map((item, iIdx) => (
                <li key={item.id} className="border-t border-espresso/10 pt-4">
                  <form action={saveItem} className="grid grid-cols-[1fr_6rem] gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="name" defaultValue={item.name} className={input} aria-label="Item name" />
                    <input
                      name="price"
                      inputMode="decimal"
                      defaultValue={item.price?.toFixed(2) ?? ""}
                      placeholder="Price"
                      className={input}
                      aria-label="Price"
                    />
                    <input
                      name="description"
                      defaultValue={item.description ?? ""}
                      placeholder="Description (optional)"
                      className={`${input} col-span-2`}
                      aria-label="Description"
                    />
                    <div className="col-span-2 flex flex-wrap items-center gap-2">
                      <button type="submit" className={primaryButton}>
                        Save item
                      </button>
                    </div>
                  </form>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <form action={toggleSoldOut}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="sold_out" value={String(item.sold_out)} />
                      <button
                        type="submit"
                        className={`${smallButton} ${item.sold_out ? "border-terracotta text-terracotta" : ""}`}
                      >
                        {item.sold_out ? "Sold out — mark available" : "Mark sold out"}
                      </button>
                    </form>
                    <form action={moveItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="section_id" value={section.id} />
                      <button name="dir" value="up" disabled={iIdx === 0} className={smallButton} aria-label="Move item up">
                        ↑
                      </button>
                    </form>
                    <form action={moveItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="section_id" value={section.id} />
                      <button
                        name="dir"
                        value="down"
                        disabled={iIdx === section.menu_items.length - 1}
                        className={smallButton}
                        aria-label="Move item down"
                      >
                        ↓
                      </button>
                    </form>
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmSubmit message={`Delete "${item.name}"?`} className={dangerButton}>
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            {/* Add item */}
            <form action={addItem} className="mt-5 grid grid-cols-[1fr_6rem] gap-2 border-t border-dashed border-espresso/20 pt-4">
              <input type="hidden" name="section_id" value={section.id} />
              <input name="name" required placeholder="New item name" className={input} aria-label="New item name" />
              <input name="price" inputMode="decimal" placeholder="Price" className={input} aria-label="New item price" />
              <input name="description" placeholder="Description (optional)" className={`${input} col-span-2`} aria-label="New item description" />
              <div className="col-span-2">
                <button type="submit" className={primaryButton}>
                  Add item to {section.name}
                </button>
              </div>
            </form>
          </section>
        ))}
      </div>

      {/* Add section */}
      <form action={addSection} className="mt-10 flex gap-2 rounded-2xl border border-dashed border-espresso/30 p-4">
        <input name="name" required placeholder="New section, e.g. Pastries" className={input} aria-label="New section name" />
        <button type="submit" className={primaryButton}>
          Add section
        </button>
      </form>
    </main>
  );
}
