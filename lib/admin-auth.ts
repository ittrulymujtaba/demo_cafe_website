import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/supabase-server";

export const DEMO_SLUG = "westward-demo";

// Returns a session-bound client and the café this user administers, or sends the
// visitor to the login page. Row-level security still applies to every query made with `sb`.
export async function requireAdmin() {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");

  // Which café does this login administer? (The owner has the main café; the demo login has the demo copy.)
  const { data: link } = await sb
    .from("cafe_admins")
    .select("cafe_id, cafes(slug, name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const cafe = link?.cafes as unknown as { slug: string; name: string } | null | undefined;
  if (!link || !cafe) {
    return { sb, user, allowed: false as const, cafeId: null as string | null, cafeName: "", cafeSlug: "", isDemo: false };
  }
  return {
    sb,
    user,
    allowed: true as const,
    cafeId: link.cafe_id as string,
    cafeName: cafe.name,
    cafeSlug: cafe.slug,
    isDemo: cafe.slug === DEMO_SLUG,
  };
}

// For the admin's demo strip: who's signed in and is it the demo login? Never redirects.
export async function currentDemoStatus() {
  const sb = await serverSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return { signedIn: false, isDemo: false };

  const { data: link } = await sb
    .from("cafe_admins")
    .select("cafes(slug)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const cafe = link?.cafes as unknown as { slug: string } | null | undefined;
  return { signedIn: true, isDemo: cafe?.slug === DEMO_SLUG };
}
