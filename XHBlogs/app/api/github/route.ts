// The former comment login endpoint is intentionally unavailable.
export function POST() {
  return Response.json({ error: "Comments disabled" }, { status: 404 });
}
