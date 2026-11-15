import Link from "next/link";
import "../components/atelier/compact-pages.css";
export default function NotFound() {
  return (
    <main className="page-wrap quiet-page quiet-not-found">
      <header className="extra-heading">
        <h1>没找到这一页</h1>
        <p>可能是地址写错了，也可能已经搬走了。</p>
      </header>
      <Link className="text-link" href="/">
        回到首页 ↗
      </Link>
    </main>
  );
}
