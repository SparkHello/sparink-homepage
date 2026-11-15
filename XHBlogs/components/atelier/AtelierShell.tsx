"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowUp, Menu, X } from "lucide-react";
import { siteConfig } from "../../siteConfig";
const links = [
  { href: "/projects", label: "作品", en: "Work" },
  { href: "/timeline", label: "手记", en: "Journal" },
  { href: "/photowall", label: "瞬间", en: "Life" },
  { href: "/about", label: "关于", en: "About" },
].filter((link) => link.href !== "/photowall" || siteConfig.features.photoWall);
export function Mark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 2v28M2 16h28M6.1 6.1l19.8 19.8M6.1 25.9 25.9 6.1"
        stroke="currentColor"
        strokeWidth="3.2"
      />
      <circle cx="16" cy="16" r="5" fill="currentColor" />
    </svg>
  );
}
export default function AtelierShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("UTC +08:00");
  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Shanghai",
          hour: "2-digit",
          minute: "2-digit",
        }) + " CST",
      );
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        跳转到内容
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="Sparink 首页">
            <Mark />
            <span>
              sparink<span className="brand-period">.</span>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="主导航">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                <span>{link.label}</span>
                <small>{link.en}</small>
              </Link>
            ))}
          </nav>
          <a className="header-contact" href="mailto:sparinkme@gmail.com">
            聊聊想法 <ArrowUpRight size={15} />
          </a>
          <button
            className="mobile-menu-button"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="移动导航"
          >
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                <small>0{i + 1}</small>
                {link.label}
                <span>{link.en}</span>
                <ArrowUpRight />
              </Link>
            ))}
            <a href="mailto:sparinkme@gmail.com">
              sparinkme@gmail.com <ArrowUpRight size={18} />
            </a>
          </nav>
        )}
      </header>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <footer className="site-footer page-wrap">
        <div className="footer-top">
          <p className="eyebrow">
            <span className="live-dot" /> ALWAYS CURIOUS
          </p>
          <a href="mailto:sparinkme@gmail.com" className="footer-invitation">
            让有趣的想法，
            <br />
            在这里发生。
            <ArrowUpRight />
          </a>
          <div className="footer-contact">
            <p>关于项目、想法，或只是打个招呼。</p>
            <a href="mailto:sparinkme@gmail.com">
              sparinkme@gmail.com <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Sparink</span>
          <span className="footer-clock">{time}</span>
          <div>
            <a
              href="https://github.com/SparkHello"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
            {siteConfig.features.music && <Link href="/music">我的歌单 ↗</Link>}
            {siteConfig.features.lab && <Link href="/tree">实验室 ↗</Link>}
            <Link href="/colophon">关于本站 ↗</Link>
            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                })
              }
              aria-label="返回顶部"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
