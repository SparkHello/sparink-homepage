export function GET() {
  return Response.json({ code: "404", message: "Weather disabled" }, { status: 404 });
}
