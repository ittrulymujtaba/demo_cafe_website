import { Suspense } from "react";
import { connection } from "next/server";
import { adminButton, adminInput, AdminNav, NoAccess } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";
import { saveDetails } from "../content-actions";

export default function DetailsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <h1 className="font-display text-2xl font-semibold">Café details</h1>
      <AdminNav />
      <Suspense fallback={<p className="mt-6 text-espresso/70">Loading…</p>}>
        <DetailsEditor />
      </Suspense>
    </main>
  );
}

async function DetailsEditor() {
  await connection();
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) return <NoAccess />;

  const { data: cafe } = await sb
    .from("cafes")
    .select("name, tagline, about, phone, address, map_url, instagram_url, facebook_url, is_demo")
    .eq("id", cafeId)
    .single();
  if (!cafe) return <NoAccess />;

  return (
    <form action={saveDetails} className="mt-6 space-y-4 rounded-2xl bg-white/60 p-5">
      <Field label="Café name" name="name" defaultValue={cafe.name} required />
      <Field label="Tagline" name="tagline" defaultValue={cafe.tagline ?? ""} />
      <label className="block text-sm font-medium">
        About (two or three lines)
        <textarea
          name="about"
          rows={4}
          defaultValue={cafe.about ?? ""}
          className={`${adminInput} mt-1`}
        />
      </label>
      <Field
        label="Phone"
        name="phone"
        defaultValue={cafe.phone ?? ""}
        hint={cafe.is_demo ? "Demo cafés show a note instead of a call button." : undefined}
      />
      <Field label="Address" name="address" defaultValue={cafe.address ?? ""} hint="Shown on the page and used for the map." />
      <Field label="Directions link" name="map_url" defaultValue={cafe.map_url ?? ""} hint="Google Maps link, for the Get directions button." />
      <Field label="Instagram link" name="instagram_url" defaultValue={cafe.instagram_url ?? ""} />
      <Field label="Facebook link" name="facebook_url" defaultValue={cafe.facebook_url ?? ""} />

      <button type="submit" className={adminButton}>
        Save details
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  hint,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} defaultValue={defaultValue} required={required} className={`${adminInput} mt-1`} />
      {hint && <span className="mt-1 block text-xs font-normal text-espresso/60">{hint}</span>}
    </label>
  );
}
