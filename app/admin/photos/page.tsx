import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import ConfirmSubmit from "@/components/confirm-submit";
import { adminButton, adminDangerButton, AdminNav, NoAccess } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";
import { addGalleryPhoto, deleteGalleryPhoto, setHeroPhoto } from "../content-actions";

export default function PhotosPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <h1 className="font-display text-2xl font-semibold">Photos</h1>
      <AdminNav />
      <Suspense fallback={<p className="mt-6 text-espresso/70">Loading…</p>}>
        <PhotosEditor />
      </Suspense>
    </main>
  );
}

async function PhotosEditor() {
  await connection();
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) return <NoAccess />;

  const { data: cafe } = await sb
    .from("cafes")
    .select("hero_image, gallery_images(id, url, position)")
    .eq("id", cafeId)
    .single();
  if (!cafe) return <NoAccess />;

  const gallery = [...(cafe.gallery_images ?? [])].sort((a, b) => a.position - b.position);

  return (
    <>
      <section className="mt-6">
        <h2 className="font-display text-xl font-semibold">Hero photo</h2>
        <p className="mt-1 text-sm text-espresso/70">
          The big photo at the top of the home page. Landscape, at least 2000 px wide works best.
        </p>

        <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-2xl bg-latte">
          {cafe.hero_image ? (
            <Image src={cafe.hero_image} alt="Current hero photo" fill sizes="(min-width: 640px) 640px, 100vw" className="object-cover" />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-espresso/60">No hero photo yet</p>
          )}
        </div>

        <form action={setHeroPhoto} className="mt-4 flex flex-wrap items-center gap-3">
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
          <button type="submit" className={adminButton}>
            Replace hero photo
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Gallery</h2>
        <p className="mt-1 text-sm text-espresso/70">Shown as a grid near the bottom of the page.</p>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.map((img, i) => (
            <li key={img.id} className="rounded-2xl bg-white/60 p-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-latte">
                <Image src={img.url} alt={`Gallery photo ${i + 1}`} fill sizes="(min-width: 640px) 200px, 45vw" className="object-cover" />
              </div>
              <form action={deleteGalleryPhoto} className="mt-2">
                <input type="hidden" name="id" value={img.id} />
                <input type="hidden" name="url" value={img.url} />
                <ConfirmSubmit message="Remove this photo from the gallery?" className={`${adminDangerButton} w-full`}>
                  Remove
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>

        <form action={addGalleryPhoto} className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-espresso/30 p-4">
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
          <button type="submit" className={adminButton}>
            Add to gallery
          </button>
        </form>
        <p className="mt-2 text-xs text-espresso/60">JPG, PNG or WebP, up to 50 MB each.</p>
      </section>
    </>
  );
}
