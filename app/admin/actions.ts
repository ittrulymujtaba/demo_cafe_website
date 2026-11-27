"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { clip } from "@/lib/limits";
import { serverSupabase } from "@/lib/supabase-server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parsePrice(raw: string): number | null {
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) throw new Error("Price must be a positive number");
  return Math.round(n * 100) / 100;
}

// Make the public café page rebuild the next time it's read, and refresh the editor.
function publish() {
  updateTag("cafes");
  revalidatePath("/admin");
}

function fail(message: string): never {
  throw new Error(message);
}

// --- Login ---

export async function signIn(formData: FormData) {
  const sb = await serverSupabase();
  const { error } = await sb.auth.signInWithPassword({
    email: text(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function signOut() {
  const sb = await serverSupabase();
  await sb.auth.signOut();
  redirect("/admin/login");
}

// --- Sections ---

export async function addSection(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");
  const name = clip(text(formData, "name"), 60, "Name");
  if (!name) return;

  const { data: last } = await sb
    .from("menu_sections")
    .select("position")
    .eq("cafe_id", cafeId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await sb
    .from("menu_sections")
    .insert({ cafe_id: cafeId, name, position: (last?.position ?? -1) + 1 });
  if (error) fail(error.message);
  publish();
}

export async function renameSection(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  const name = clip(text(formData, "name"), 60, "Name");
  if (!name) return;
  const { error } = await sb.from("menu_sections").update({ name }).eq("id", text(formData, "id"));
  if (error) fail(error.message);
  publish();
}

export async function deleteSection(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  const { error } = await sb.from("menu_sections").delete().eq("id", text(formData, "id"));
  if (error) fail(error.message);
  publish();
}

export async function moveSection(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");
  await moveRow(sb, "menu_sections", text(formData, "id"), text(formData, "dir") as "up" | "down", {
    column: "cafe_id",
    value: cafeId,
  });
  publish();
}

// --- Items ---

export async function addItem(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  const name = clip(text(formData, "name"), 60, "Name");
  if (!name) return;
  const sectionId = text(formData, "section_id");

  const { data: last } = await sb
    .from("menu_items")
    .select("position")
    .eq("section_id", sectionId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await sb.from("menu_items").insert({
    section_id: sectionId,
    name,
    description: clip(text(formData, "description"), 160, "Description") || null,
    price: parsePrice(text(formData, "price")),
    sold_out: false,
    position: (last?.position ?? -1) + 1,
  });
  if (error) fail(error.message);
  publish();
}

export async function saveItem(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  const name = clip(text(formData, "name"), 60, "Name");
  if (!name) return;
  const { error } = await sb
    .from("menu_items")
    .update({
      name,
      description: clip(text(formData, "description"), 160, "Description") || null,
      price: parsePrice(text(formData, "price")),
    })
    .eq("id", text(formData, "id"));
  if (error) fail(error.message);
  publish();
}

export async function toggleSoldOut(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  const soldOut = text(formData, "sold_out") !== "true"; // flip the current value
  const { error } = await sb
    .from("menu_items")
    .update({ sold_out: soldOut })
    .eq("id", text(formData, "id"));
  if (error) fail(error.message);
  publish();
}

export async function deleteItem(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  const { error } = await sb.from("menu_items").delete().eq("id", text(formData, "id"));
  if (error) fail(error.message);
  publish();
}

export async function moveItem(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  await moveRow(sb, "menu_items", text(formData, "id"), text(formData, "dir") as "up" | "down", {
    column: "section_id",
    value: text(formData, "section_id"),
  });
  publish();
}

// Swap a row with its neighbour, then renumber the whole group 0..n-1 so
// duplicate or gapped positions can't stop reordering from working.
type Sb = Awaited<ReturnType<typeof serverSupabase>>;
async function moveRow(
  sb: Sb,
  table: "menu_sections" | "menu_items",
  id: string,
  dir: "up" | "down",
  scope: { column: string; value: string },
) {
  const { data: rows } = await sb
    .from(table)
    .select("id, position")
    .eq(scope.column, scope.value)
    .order("position")
    .order("id");
  if (!rows) return;

  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;

  const reordered = [...rows];
  [reordered[i], reordered[j]] = [reordered[j], reordered[i]];

  await Promise.all(
    reordered.map((row, index) =>
      row.position === index
        ? null
        : sb.from(table).update({ position: index }).eq("id", row.id),
    ),
  );
}
