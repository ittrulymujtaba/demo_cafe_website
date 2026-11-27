"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { CAFE_SLUG } from "@/lib/cafe";

const BUCKET = "cafe-photos";
const MAX_PHOTO_BYTES = 50 * 1024 * 1024; // Supabase's default per-file cap on the free plan
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function fail(message: string): never {
  throw new Error(message);
}

function publish() {
  updateTag(`cafe:${CAFE_SLUG}`);
  for (const path of ["/admin", "/admin/hours", "/admin/specials", "/admin/details", "/admin/photos"]) {
    revalidatePath(path);
  }
}

// --- Hours ---

export async function saveHours(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");

  const rows = [];
  for (let weekday = 0; weekday <= 6; weekday++) {
    const closed = formData.get(`closed_${weekday}`) === "on";
    const opens = text(formData, `opens_${weekday}`);
    const closes = text(formData, `closes_${weekday}`);
    if (!closed && (!opens || !closes || opens >= closes)) {
      fail(`Check the hours for day ${weekday}: opening time must be before closing time.`);
    }
    rows.push({
      cafe_id: cafeId,
      weekday,
      closed,
      opens: closed ? null : opens,
      closes: closed ? null : closes,
    });
  }

  const { error } = await sb.from("opening_hours").upsert(rows, { onConflict: "cafe_id,weekday" });
  if (error) fail(error.message);
  publish();
}

export async function addSpecialDate(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");
  const date = text(formData, "date");
  if (!date) return;

  const { error } = await sb.from("special_dates").insert({
    cafe_id: cafeId,
    date,
    note: text(formData, "note") || null,
    closed: formData.get("closed") === "on",
  });
  if (error) fail(error.message);
  publish();
}

export async function deleteSpecialDate(formData: FormData) {
  const { sb, allowed } = await requireAdmin();
  if (!allowed) fail("Not an admin of this café");
  const { error } = await sb.from("special_dates").delete().eq("id", text(formData, "id"));
  if (error) fail(error.message);
  publish();
}

// --- Specials banner: one active special at a time ---

export async function saveSpecial(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");

  const body = text(formData, "text");
  const starts = text(formData, "starts_on");
  const ends = text(formData, "ends_on");
  if (starts && ends && starts > ends) fail("The end date must be on or after the start date.");

  // Replace whatever special is set. An empty text means no banner.
  const { error: clearError } = await sb.from("specials").delete().eq("cafe_id", cafeId);
  if (clearError) fail(clearError.message);

  if (body) {
    const { error } = await sb.from("specials").insert({
      cafe_id: cafeId,
      text: body,
      starts_on: starts || null,
      ends_on: ends || null,
    });
    if (error) fail(error.message);
  }
  publish();
}

// --- Café details ---

export async function saveDetails(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");

  const name = text(formData, "name");
  if (!name) fail("The café needs a name.");

  const { error } = await sb
    .from("cafes")
    .update({
      name,
      tagline: text(formData, "tagline") || null,
      about: text(formData, "about") || null,
      phone: text(formData, "phone") || null,
      address: text(formData, "address") || null,
      map_url: text(formData, "map_url") || null,
      instagram_url: text(formData, "instagram_url") || null,
      facebook_url: text(formData, "facebook_url") || null,
    })
    .eq("id", cafeId);
  if (error) fail(error.message);
  publish();
}

// --- Photos ---

function photoFile(formData: FormData): { file: File; ext: string } {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) fail("Choose a photo to upload.");
  const ext = PHOTO_TYPES[file.type];
  if (!ext) fail("Photos must be JPG, PNG or WebP.");
  if (file.size > MAX_PHOTO_BYTES) fail("Photos must be 50 MB or smaller.");
  return { file, ext };
}

async function uploadPhoto(
  sb: Awaited<ReturnType<typeof requireAdmin>>["sb"],
  cafeId: string,
  file: File,
  ext: string,
  label: string,
) {
  const path = `${cafeId}/${label}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (error) fail(error.message);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function setHeroPhoto(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");
  const { file, ext } = photoFile(formData);

  const url = await uploadPhoto(sb, cafeId, file, ext, "hero");
  const { error } = await sb.from("cafes").update({ hero_image: url }).eq("id", cafeId);
  if (error) fail(error.message);
  publish();
}

export async function addGalleryPhoto(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");
  const { file, ext } = photoFile(formData);

  const url = await uploadPhoto(sb, cafeId, file, ext, "gallery");
  const { data: last } = await sb
    .from("gallery_images")
    .select("position")
    .eq("cafe_id", cafeId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await sb
    .from("gallery_images")
    .insert({ cafe_id: cafeId, url, position: (last?.position ?? -1) + 1 });
  if (error) fail(error.message);
  publish();
}

export async function deleteGalleryPhoto(formData: FormData) {
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) fail("Not an admin of this café");
  const id = text(formData, "id");
  const url = text(formData, "url");

  const { error } = await sb.from("gallery_images").delete().eq("id", id);
  if (error) fail(error.message);

  // Remove the file too, if it lives in our bucket (demo placeholders don't).
  const marker = `/${BUCKET}/`;
  const at = url.indexOf(marker);
  if (at !== -1) {
    await sb.storage.from(BUCKET).remove([decodeURIComponent(url.slice(at + marker.length))]);
  }
  publish();
}
