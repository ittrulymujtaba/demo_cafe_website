import { Suspense } from "react";
import { connection } from "next/server";
import { adminButton, adminInput, AdminNav, NoAccess } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";
import { saveSpecial } from "../content-actions";

export default function SpecialsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <h1 className="font-display text-2xl font-semibold">Specials banner</h1>
      <AdminNav />
      <Suspense fallback={<p className="mt-6 text-espresso/70">Loading…</p>}>
        <SpecialsEditor />
      </Suspense>
    </main>
  );
}

async function SpecialsEditor() {
  await connection();
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) return <NoAccess />;

  const { data: special } = await sb
    .from("specials")
    .select("text, starts_on, ends_on")
    .eq("cafe_id", cafeId)
    .order("starts_on", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <p className="mt-4 text-sm text-espresso/70">
        This shows as a bar across the top of the site. Leave the text empty to hide it.
      </p>

      <form action={saveSpecial} className="mt-6 space-y-4 rounded-2xl bg-white/60 p-5">
        <label className="block text-sm font-medium">
          Banner text
          <input
            name="text"
            maxLength={140}
            defaultValue={special?.text ?? ""}
            placeholder="e.g. Free upgrade to oat milk all week"
            className={`${adminInput} mt-1`}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Starts (optional)
            <input type="date" name="starts_on" defaultValue={special?.starts_on ?? ""} className={`${adminInput} mt-1`} />
          </label>
          <label className="block text-sm font-medium">
            Ends (optional)
            <input type="date" name="ends_on" defaultValue={special?.ends_on ?? ""} className={`${adminInput} mt-1`} />
          </label>
        </div>
        <p className="text-xs text-espresso/60">
          Leave both dates empty to show it until you change it. Dates use New Zealand time.
        </p>
        <button type="submit" className={adminButton}>
          Save banner
        </button>
      </form>
    </>
  );
}
