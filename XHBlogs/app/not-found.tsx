import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-wrap colophon">
      <p className="section-kicker">404 / UNCHARTED TERRITORY</p>
      <h1>走到留白的地方了。</h1>
      <p>这一页还不存在，或已经搬去了别处。回到首页，再发现一些有趣的东西。</p>
      <Link className="text-link" href="/">
        回到首页 ↗
      </Link>
    </main>
  );
}
