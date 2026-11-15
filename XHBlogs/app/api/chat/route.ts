// Keep the retired endpoint's response for existing links and clients.
export function GET() {
  return Response.json({ status: "Disabled" }, { status: 404 });
}

export function POST() {
  return Response.json({ error: "AI chat disabled" }, { status: 404 });
}
