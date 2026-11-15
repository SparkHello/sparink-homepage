"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import NotePopover from "./NotePopover";

export default function InlineNote({ label, children }: { label: string; children: ReactNode }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const id = useId();
  const close = useCallback((restoreFocus = false) => {
    clearTimeout(timer.current); setOpen(false); setPinned(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }, []);
  const leave = () => { if (!pinned) timer.current = setTimeout(() => close(), 180); };
  useEffect(() => () => clearTimeout(timer.current), []);
  return <span className="inline-note">
    <button ref={trigger} type="button" className="inline-note-word" aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="dialog" onPointerEnter={event => { if (event.pointerType !== "touch") { clearTimeout(timer.current); setOpen(true); } }} onPointerLeave={leave} onClick={() => { if (pinned) close(); else { clearTimeout(timer.current); setPinned(true); setOpen(true); } }}>{label}</button>
    {open && trigger.current && <NotePopover anchor={trigger.current} id={id} onClose={close} focusOnOpen={pinned} onPointerEnter={() => clearTimeout(timer.current)} onPointerLeave={leave}>{children}</NotePopover>}
  </span>;
}
