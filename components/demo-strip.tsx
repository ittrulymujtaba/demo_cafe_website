import Link from "next/link";
import { connection } from "next/server";
import ConfirmSubmit from "@/components/confirm-submit";
import { currentDemoStatus } from "@/lib/admin-auth";
import { resetDemo } from "@/app/admin/demo-actions";

// Shown across the top of the admin when the demo login is signed in.
export default async function DemoStrip() {
  await connection();
  const { isDemo } = await currentDemoStatus();
  if (!isDemo) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-espresso px-4 py-3 text-sm text-cream">
      <p>
        <span className="font-semibold">Demo mode.</span> Changes appear at{" "}
        <Link href="/demo" className="underline underline-offset-4">
          /demo
        </Link>{" "}
        and reset every night.
      </p>
      <form action={resetDemo}>
        <ConfirmSubmit
          message="Reset the demo back to the original café? Your changes will be lost."
          className="rounded-lg border border-cream/60 px-3 py-1.5 font-medium hover:bg-cream/10"
        >
          Reset demo
        </ConfirmSubmit>
      </form>
    </div>
  );
}
