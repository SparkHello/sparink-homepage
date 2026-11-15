"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import NotePopover from "./NotePopover";

type OpenNote = { anchor: HTMLAnchorElement; html: string; pinned: boolean };

/** Standard Markdown footnotes remain readable and linkable without this enhancement. */
export default function DiaryProse({ html }: { html: string }) {
  const prose = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const active = useRef<OpenNote | null>(null);
  const [note, setNote] = useState<OpenNote | null>(null);
  const id = useId();
  const close = useCallback((restoreFocus = false) => {
    clearTimeout(timer.current);
    const previous = active.current;
    active.current = null; setNote(null);
    if (restoreFocus) previous?.anchor.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    close();
    const element = prose.current;
    if (!element || !html.includes("data-footnote-ref")) return;
    const references = Array.from(element.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]"));
    const activate = (anchor: HTMLAnchorElement, pinned: boolean) => {
      const targetId = anchor.getAttribute("href")?.slice(1);
      const target = Array.from(element.querySelectorAll<HTMLElement>("[data-footnotes] li[id]")).find(item => item.id === targetId);
      if (!target) return false;
      clearTimeout(timer.current);
      if (active.current?.anchor === anchor && active.current.pinned && pinned) { close(); return true; }
      const copy = target.cloneNode(true) as HTMLElement;
      copy.querySelectorAll("[data-footnote-backref]").forEach(back => back.remove());
      copy.querySelectorAll("[id]").forEach(item => item.removeAttribute("id"));
      const next = { anchor, html: copy.innerHTML, pinned: pinned || (active.current?.anchor === anchor && active.current.pinned) };
      active.current = next; setNote(next);
      return true;
    };
    const enter = (event: PointerEvent) => { if (event.pointerType !== "touch" && !active.current?.pinned) activate(event.currentTarget as HTMLAnchorElement, false); };
    const leave = () => { if (!active.current?.pinned) timer.current = setTimeout(() => close(), 180); };
    const click = (event: MouseEvent) => { if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; if (activate(event.currentTarget as HTMLAnchorElement, true)) event.preventDefault(); };
    references.forEach(anchor => { anchor.setAttribute("aria-haspopup", "dialog"); anchor.addEventListener("pointerenter", enter); anchor.addEventListener("pointerleave", leave); anchor.addEventListener("click", click); });
    return () => { clearTimeout(timer.current); active.current = null; references.forEach(anchor => { anchor.removeAttribute("aria-haspopup"); anchor.removeEventListener("pointerenter", enter); anchor.removeEventListener("pointerleave", leave); anchor.removeEventListener("click", click); }); };
  }, [html, close]);

  useEffect(() => {
    if (!note) return;
    note.anchor.setAttribute("aria-expanded", "true"); note.anchor.setAttribute("aria-controls", id);
    return () => { note.anchor.removeAttribute("aria-expanded"); note.anchor.removeAttribute("aria-controls"); };
  }, [note, id]);

  return <>
    <div ref={prose} className="article-prose diary-prose" dangerouslySetInnerHTML={{ __html: html }} />
    {note && <NotePopover anchor={note.anchor} id={id} onClose={close} focusOnOpen={note.pinned} onPointerEnter={() => clearTimeout(timer.current)} onPointerLeave={() => { if (!active.current?.pinned) timer.current = setTimeout(() => close(), 180); }}><div dangerouslySetInnerHTML={{ __html: note.html }} /></NotePopover>}
  </>;
}
