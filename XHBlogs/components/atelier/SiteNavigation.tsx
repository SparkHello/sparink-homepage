"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { siteConfig } from "../../siteConfig";

const links = [
  { href: "/timeline", label: "日记" },
  { href: "/photowall", label: "相册" },
  { href: "/about", label: "关于" },
].filter(link => link.href !== "/photowall" || siteConfig.features.photoWall);

export default function SiteNavigation() {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  const [position, setPosition] = useState({ x: 0, visible: false });
  const active = (href: string) => href === "/timeline"
    ? ["/timeline", "/posts", "/chatter", "/moments"].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
    : pathname === href || pathname.startsWith(`${href}/`);

  useLayoutEffect(() => {
    const element = nav.current;
    if (!element) return;
    const measure = () => {
      const selected = element.querySelector<HTMLAnchorElement>('[aria-current="page"]');
      setPosition(previous => {
        const next = selected ? { x: selected.offsetLeft + selected.offsetWidth / 2 - 10, visible: true } : { ...previous, visible: false };
        return previous.x === next.x && previous.visible === next.visible ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const link of element.querySelectorAll("a")) observer.observe(link);
    return () => observer.disconnect();
  }, [pathname]);

  return <nav ref={nav} className="home-navigation" aria-label="主导航">
    {links.map(link => <Link key={link.href} href={link.href} aria-current={active(link.href) ? "page" : undefined}>{link.label}</Link>)}
    <span className="home-nav-indicator" aria-hidden="true" style={{ transform: `translateX(${position.x}px)`, opacity: position.visible ? 1 : 0 }} />
  </nav>;
}
