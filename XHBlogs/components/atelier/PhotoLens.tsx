"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Scan } from "lucide-react";
import styles from "./PhotoLens.module.css";

type LensRenderer = { request: () => void; dispose: () => void };

export default function PhotoLens({ src, alt }: { src: string; alt: string }) {
  const descriptionId = useId();
  const stage = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<LensRenderer | null>(null);
  const pointer = useRef({ x: .52, y: .48, active: false });
  const pinned = useRef(false);
  const pointerType = useRef("mouse");
  const [started, setStarted] = useState(false);
  const [held, setHeld] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  function activate(active: boolean) {
    pointer.current.active = active;
    if (active) setStarted(true);
    engine.current?.request();
  }

  function toggleLens() {
    pinned.current = !pinned.current;
    setHeld(pinned.current);
    activate(pinned.current);
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") { pinned.current = false; setHeld(false); activate(false); return; }
    const directions: Record<string, [number, number]> = { ArrowLeft: [-.07, 0], ArrowRight: [.07, 0], ArrowUp: [0, .07], ArrowDown: [0, -.07] };
    const step = directions[event.key];
    if (!step || unavailable) return;
    event.preventDefault();
    pointer.current.x = Math.max(.08, Math.min(.92, pointer.current.x + step[0]));
    pointer.current.y = Math.max(.08, Math.min(.92, pointer.current.y + step[1]));
    activate(true);
  }

  useEffect(() => {
    if (!started || !stage.current || !canvas.current) return;
    let disposed = false;
    const controller = new AbortController();
    let renderer: LensRenderer | null = null;
    // Import the renderer only after someone interacts with this photograph.
    import("./photo-lens-renderer").then(async ({ createPhotoLens }) => {
      if (disposed || !canvas.current || !stage.current) return;
      renderer = await createPhotoLens(canvas.current, stage.current, src, pointer.current, () => pointer.current, controller.signal);
      if (disposed) { renderer.dispose(); return; }
      engine.current = renderer;
      setReady(true);
      renderer.request();
    }).catch(() => { if (!disposed) setUnavailable(true); });
    return () => { disposed = true; controller.abort(); renderer?.dispose(); engine.current = null; };
  }, [started, src]);

  return <figure className={styles.figure} onKeyDown={handleKeys}>
    <button
      ref={stage}
      type="button"
      className={styles.photo}
      disabled={unavailable}
      aria-label={`${alt}，点击拿起或放下透镜，方向键移动，Escape 放下`}
      aria-describedby={descriptionId}
      aria-pressed={held}
      onClick={event => {
        if (event.detail > 0 && pointerType.current !== "mouse") {
          pinned.current = true; setHeld(true); activate(true);
        } else toggleLens();
      }}
      onPointerDown={event => {
        pointerType.current = event.pointerType;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointer.current.x = Math.max(.08, Math.min(.92, (event.clientX - bounds.left) / bounds.width));
        pointer.current.y = Math.max(.08, Math.min(.92, 1 - (event.clientY - bounds.top) / bounds.height));
      }}
      onPointerEnter={event => { if (event.pointerType === "mouse") activate(true); }}
      onPointerLeave={() => { if (!pinned.current) activate(false); }}
      onPointerMove={event => {
        if (event.pointerType !== "mouse" && !pinned.current) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        pointer.current.x = Math.max(.08, Math.min(.92, (event.clientX - bounds.left) / bounds.width));
        pointer.current.y = Math.max(.08, Math.min(.92, 1 - (event.clientY - bounds.top) / bounds.height));
        activate(true);
      }}
      onBlur={() => { if (!pinned.current) activate(false); }}
    >
      <img src={src} alt={alt} loading="lazy" draggable={false} />
      <canvas ref={canvas} className={ready && !unavailable ? styles.ready : ""} aria-hidden="true" />
    </button>
    <figcaption className={styles.caption} id={descriptionId}>
      <span>{alt}</span>
      {!unavailable && <button type="button" onClick={toggleLens} aria-pressed={held} className={styles.control}><Scan size={14} aria-hidden="true" />{held ? "放下透镜" : "拿起透镜"}</button>}
    </figcaption>
  </figure>;
}
