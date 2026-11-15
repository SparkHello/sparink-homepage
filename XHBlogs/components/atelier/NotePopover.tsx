"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./inline-notes.css";

export default function NotePopover({ anchor, id, children, onClose, focusOnOpen = false, onPointerEnter, onPointerLeave }: {
  anchor: HTMLElement; id: string; children: ReactNode;
  onClose: (restoreFocus?: boolean) => void; focusOnOpen?: boolean;
  onPointerEnter?: () => void; onPointerLeave?: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const focused = useRef(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) return;
    const place = () => {
      const target = anchor.getBoundingClientRect();
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const availableHeight = window.visualViewport?.height || window.innerHeight;
      const below = target.bottom + 10;
      const top = target.top - height - 10 > 12 ? target.top - height - 10 : Math.min(below, availableHeight - height - 12);
      setPosition({ left: Math.max(12, Math.min(target.left + target.width / 2 - width / 2, window.innerWidth - width - 12)), top: Math.max(12, top) });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener("resize", place);
    const scroll = (event: Event) => { if (!(event.target instanceof Node) || !element.contains(event.target)) onClose(false); };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !element.contains(event.target) && !anchor.contains(event.target)) onClose(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(true); } };
    window.addEventListener("scroll", scroll, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { observer.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", scroll, true); document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [anchor, onClose]);

  useLayoutEffect(() => {
    if (!focusOnOpen) { focused.current = false; return; }
    if (position && !focused.current) {
      focused.current = true;
      closeButton.current?.focus({ preventScroll: true });
    }
  }, [focusOnOpen, position]);

  return createPortal(<div ref={panel} id={id} role="dialog" aria-label="补充" className="inline-note-popover" style={{ left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? "visible" : "hidden" }} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave} onBlur={event => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget) && !anchor.contains(event.relatedTarget)) onClose(false); }}>
    <button ref={closeButton} type="button" className="inline-note-close" aria-label="收起补充" onClick={() => onClose(true)}><X size={15} /></button>
    <div className="inline-note-content">{children}</div>
  </div>, document.body);
}
