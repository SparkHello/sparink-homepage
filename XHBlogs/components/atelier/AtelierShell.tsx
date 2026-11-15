"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { siteConfig } from "../../siteConfig";

const links = [
  { href: "/timeline", label: "日记" },
  { href: "/photowall", label: "相册" },
  { href: "/about", label: "关于" },
].filter((link) => link.href !== "/photowall" || siteConfig.features.photoWall);

export function Mark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 2v28M2 16h28M6.1 6.1l19.8 19.8M6.1 25.9 25.9 6.1" stroke="currentColor" strokeWidth="3.2" />
      <circle cx="16" cy="16" r="5" fill="currentColor" />
    </svg>
  );
}

export default function AtelierShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => href === "/timeline"
    ? ["/timeline", "/posts", "/chatter", "/moments"].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="personal-site">
      <a className="skip-link" href="#main-content">跳转到内容</a>
      <header className="home-header">
        <div className="personal-wrap home-header-inner">
          <Link className="home-brand" href="/" aria-label="Sparink 首页">
            <Mark /><span>sparink<span className="brand-period">.</span></span>
          </Link>
          <nav className="home-navigation" aria-label="主导航">
            {links.map((link) => <Link key={link.href} href={link.href} aria-current={active(link.href) ? "page" : undefined}>{link.label}</Link>)}
          </nav>
        </div>
      </header>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <footer className="home-footer personal-wrap">
        <div className="home-footer-inner">
          <span>© {new Date().getFullYear()} Sparink</span>
          <div>
            {siteConfig.features.music && <Link href="/music">听听歌</Link>}
            <Link href="/colophon">关于本站</Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })} aria-label="返回顶部"><ArrowUp size={16} /></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
