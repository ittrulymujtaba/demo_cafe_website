import { Suspense } from "react";
import { connection } from "next/server";
import ConfirmSubmit from "@/components/confirm-submit";
import DayHours from "@/components/day-hours";
import SaveButton from "@/components/save-button";
import { adminButton, adminDangerButton, adminInput, AdminNav, NoAccess } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";
import { WEEKDAY_NAMES } from "@/lib/cafe";
import { addSpecialDate, deleteSpecialDate, saveHours } from "../content-actions";

export default function HoursPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <h1 className="font-display text-2xl font-semibold">Hours</h1>
      <AdminNav />
      <Suspense fallback={<p className="mt-6 text-espresso/70">Loading…</p>}>
        <HoursEditor />
      </Suspense>
    </main>
  );
}

async function HoursEditor() {
  await connection();
  const { sb, cafeId, allowed } = await requireAdmin();
  if (!allowed || !cafeId) return <NoAccess />;

  const [{ data: hours }, { data: dates }] = await Promise.all([
    sb.from("opening_hours").select("weekday, opens, closes, closed").eq("cafe_id", cafeId),
    sb.from("special_dates").select("id, date, note, closed").eq("cafe_id", cafeId).order("date"),
  ]);
  const byDay = new Map((hours ?? []).map((h) => [h.weekday, h]));
  // Monday first, Sunday last, matching the public page.
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <section className="mt-6">
        <h2 className="font-display text-xl font-semibold">Weekly hours</h2>
        <p className="mt-1 text-sm text-espresso/70">Tick Closed for a day you don&apos;t open.</p>

        <form action={saveHours} className="mt-4 space-y-3">
          {order.map((d) => {
            const h = byDay.get(d);
            return (
              <DayHours
                key={d}
                weekday={d}
                label={WEEKDAY_NAMES[d]}
                closed={h?.closed ?? true}
                opens={h?.opens?.slice(0, 5) ?? "07:30"}
                closes={h?.closes?.slice(0, 5) ?? "15:00"}
              />
            );
          })}
          <SaveButton label="Save hours" className={adminButton} />
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Holidays and closures</h2>
        <p className="mt-1 text-sm text-espresso/70">
          Dates you&apos;re closed, like a public holiday. The site shows these in the hours.
        </p>

        <ul className="mt-4 divide-y divide-espresso/10 overflow-hidden rounded-xl bg-white/60">
          {(dates ?? []).length === 0 && (
            <li className="p-4 text-sm text-espresso/60">No closures added.</li>
          )}
          {(dates ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{formatDate(d.date)}</p>
                <p className="text-sm text-espresso/70">
                  {d.closed ? "Closed" : "Open (special hours)"}
                  {d.note ? ` · ${d.note}` : ""}
                </p>
              </div>
              <form action={deleteSpecialDate}>
                <input type="hidden" name="id" value={d.id} />
                <ConfirmSubmit message={`Remove ${formatDate(d.date)}?`} className={adminDangerButton}>
                  Remove
                </ConfirmSubmit>
              </form>
            </li>
          ))}
        </ul>

        <form action={addSpecialDate} className="mt-4 grid gap-3 rounded-xl border border-dashed border-espresso/30 p-4">
          <label className="block text-sm font-medium">
            Date
            <input type="date" name="date" required className={`${adminInput} mt-1`} />
          </label>
          <label className="block text-sm font-medium">
            Note (optional)
            <input name="note" placeholder="e.g. Christmas Day" className={`${adminInput} mt-1`} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="closed" defaultChecked className="h-4 w-4" />
            Closed all day
          </label>
          <div>
            <SaveButton label="Add closure" className={adminButton} />
          </div>
        </form>
      </section>
    </>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
