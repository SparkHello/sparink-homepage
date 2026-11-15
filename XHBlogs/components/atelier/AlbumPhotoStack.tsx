'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Photo } from '../../data/albums';
import styles from './AlbumPhotoStack.module.css';

type Props = { photos: Photo[]; title: string; variant?: 'first' | 'second' };
type Drag = { pointerId: number; startX: number; startY: number; dx: number; dy: number; width: number; axis: 'pending' | 'horizontal' | 'vertical' };

export default function AlbumPhotoStack({ photos, title, variant = 'first' }: Props) {
  const items = photos.slice(0, 5);
  const count = items.length;
  const albumTitle = title.trim() || '相册';
  const [active, setActive] = useState(0);
  const front = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  const busy = useRef(false);
  const animation = useRef<Animation | null>(null);
  const suppressClick = useRef(false);
  const mounted = useRef(true);
  const instructionId = useId();
  const selected = count ? active % count : 0;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rest() {
    const element = front.current;
    if (!element) return;
    element.dataset.dragging = 'false';
    element.style.setProperty('--drag-x', '0px');
    element.style.setProperty('--drag-y', '0px');
    element.style.setProperty('--drag-rotation', '0deg');
    element.style.setProperty('--lift', '1');
  }

  // The same button stays mounted across flips, preserving keyboard focus.
  useLayoutEffect(() => {
    rest();
    animation.current?.cancel();
    animation.current = null;
    busy.current = false;
    front.current?.removeAttribute('aria-busy');
  }, [active]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      animation.current?.cancel();
    };
  }, []);

  function change(direction: number) {
    if (busy.current || count < 2) { rest(); return; }
    const element = front.current;
    if (!element || reducedMotion()) {
      rest();
      setActive(value => (value + direction + count) % count);
      return;
    }
    busy.current = true;
    element.setAttribute('aria-busy', 'true');
    const currentTransform = getComputedStyle(element).transform;
    element.dataset.dragging = 'false';
    const side = direction > 0 ? -1 : 1;
    const distance = Math.min(element.offsetWidth * .65, 260);
    const flight = element.animate([
      { transform: currentTransform, opacity: 1 },
      { transform: `translate3d(${side * distance}px, -23px, 0) rotate(${side * 13}deg) scale(.96)`, opacity: 0 },
    ], { duration: 260, easing: 'cubic-bezier(.25,.7,.3,1)', fill: 'forwards' });
    animation.current = flight;
    flight.finished.then(() => {
      if (mounted.current) setActive(value => (value + direction + count) % count);
    }).catch(() => {});
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (busy.current || count < 2 || !event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, width: event.currentTarget.offsetWidth, axis: 'pending' };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.dx = event.clientX - gesture.startX;
    gesture.dy = event.clientY - gesture.startY;
    const x = Math.abs(gesture.dx);
    const y = Math.abs(gesture.dy);
    if (x > 6 || y > 6) suppressClick.current = true;
    if (gesture.axis === 'pending') {
      if (y > 8 && y > x) gesture.axis = 'vertical';
      else if (x > 8 && x > y * 1.2) gesture.axis = 'horizontal';
    }
    if (gesture.axis !== 'horizontal') return;
    const element = event.currentTarget;
    element.dataset.dragging = 'true';
    element.style.setProperty('--drag-x', `${gesture.dx * .82}px`);
    element.style.setProperty('--drag-y', `${Math.max(-18, Math.min(18, gesture.dy * .12)) - 6}px`);
    element.style.setProperty('--drag-rotation', `${reducedMotion() ? 0 : Math.max(-10, Math.min(10, gesture.dx / gesture.width * 16))}deg`);
    element.style.setProperty('--lift', reducedMotion() ? '1' : '1.015');
  }

  function pointerEnd(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const gesture = drag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) { suppressClick.current = true; rest(); return; }
    const threshold = Math.max(48, Math.min(85, gesture.width * .22));
    if (gesture.axis === 'horizontal' && Math.abs(gesture.dx) >= threshold) change(gesture.dx < 0 ? 1 : -1);
    else rest();
  }

  if (!count) return null;
  const backs = Array.from({ length: Math.min(2, count - 1) }, (_, depth) => ({ depth: depth + 1, photo: items[(selected + depth + 1) % count] })).reverse();
  const current = items[selected];
  return <div className={`${styles.stack} ${variant === 'second' ? styles.second : ''}`} role="group" aria-label={`${albumTitle}，照片预览`} onKeyDown={event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); change(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); change(1); }
    if ((event.key === 'Home' || event.key === 'End') && !busy.current) { event.preventDefault(); rest(); setActive(event.key === 'Home' ? 0 : count - 1); }
  }}>
    <div className={styles.stage}>
      {backs.map(({ depth, photo }) => <div className={styles.back} key={depth} aria-hidden="true" style={{ '--depth': depth } as CSSProperties}><img src={photo.thumb || photo.url} alt="" loading="lazy" draggable={false} /></div>)}
      <button ref={front} type="button" className={styles.front} disabled={count < 2} aria-label={`${albumTitle}，第 ${selected + 1} 张照片${current.caption?.trim() ? `：${current.caption}` : ''}${count > 1 ? '。点击看下一张' : ''}`} aria-describedby={instructionId} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => pointerEnd(event)} onPointerCancel={event => pointerEnd(event, true)} onLostPointerCapture={() => { if (drag.current) { drag.current = null; suppressClick.current = true; rest(); } }} onClick={event => {
        if (event.detail > 0 && suppressClick.current) { suppressClick.current = false; return; }
        change(1);
      }}>
        <img src={current.thumb || current.url} alt="" loading="lazy" draggable={false} onError={event => { if (event.currentTarget.getAttribute('src') !== current.url) event.currentTarget.src = current.url; }} />
      </button>
    </div>
    <div className={styles.toolbar}>
      <span id={instructionId} className={styles.hint}>{count > 1 ? '拨一拨，或点一下' : '留在这里的一刻'}</span>
      <div className={styles.controls}>
        <button type="button" onClick={() => change(-1)} disabled={count < 2} aria-label={`${albumTitle}，上一张预览照片`}><ArrowLeft size={14} /></button>
        <span className={styles.counter} role="status" aria-live="polite" aria-atomic="true"><span className={styles.srOnly}>第 </span>{selected + 1}<span aria-hidden="true"> / </span><span className={styles.srOnly}> 张，共 </span>{count}<span className={styles.srOnly}> 张预览照片</span></span>
        <button type="button" onClick={() => change(1)} disabled={count < 2} aria-label={`${albumTitle}，下一张预览照片`}><ArrowRight size={14} /></button>
      </div>
    </div>
  </div>;
}
