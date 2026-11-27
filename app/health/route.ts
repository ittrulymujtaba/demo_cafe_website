// Health check for uptime monitors. Returns 200 and {"ok":true} when the site is up.
// It doesn't query the database, so it stays fast and doesn't depend on Supabase.
export function GET() {
  return Response.json({ ok: true });
}
