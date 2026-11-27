"use server";

import { revalidatePath, updateTag } from "next/cache";
import { DEMO_SLUG, requireAdmin } from "@/lib/admin-auth";

// Copies the main café back into the demo café. The database function checks that the
// caller administers the demo café, so this runs with the logged-in user's own permissions.
export async function resetDemo() {
  const { sb, allowed, cafeSlug } = await requireAdmin();
  if (!allowed || cafeSlug !== DEMO_SLUG) {
    throw new Error("Only the demo login can reset the demo.");
  }

  const { error } = await sb.rpc("reset_demo_cafe");
  if (error) throw new Error(error.message);

  updateTag("cafes");
  revalidatePath("/demo");
  revalidatePath("/admin", "layout");
}
