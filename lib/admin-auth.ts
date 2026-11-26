import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase-server";
import { CAFE_SLUG } from "@/lib/cafe";

// Returns a session-bound client and the café id, or sends the visitor to the login page.
// Also checks that the signed-in user is listed in cafe_admins for this café.
export async function requireAdmin() {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: cafe } = await sb.from("cafes").select("id, name").eq("slug", CAFE_SLUG).single();
  if (!cafe) throw new Error("Café not found");

  const { data: link } = await sb
    .from("cafe_admins")
    .select("cafe_id")
    .eq("cafe_id", cafe.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!link) {
    return { sb, user, cafeId: null as string | null, cafeName: cafe.name, allowed: false as const };
  }
  return { sb, user, cafeId: cafe.id as string, cafeName: cafe.name, allowed: true as const };
}
