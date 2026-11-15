'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import type { Album } from '../../data/albums';

export default function AlbumGallery({ album }: { album: Album }) {
  const title = album.title?.trim() || '相册';
  const [selected, setSelected] = useState<number | null>(null);
  const [imageStates, setImageStates] = useState<Record<string, 'loaded' | 'error'>>({});
  const [retry, setRetry] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const photo = selected === null ? null : album.photos[selected];
  const isOpen = selected !== null;
  const imageState = photo ? imageStates[photo.url] : undefined;

  function open(index: number, trigger: HTMLButtonElement) {
    opener.current = trigger;
    setSelected(index);
    dialog.current?.showModal();
  }
  function next(direction: number) {
    if (!album.photos.length) return;
    setSelected(index => index === null ? null : (index + direction + album.photos.length) % album.photos.length);
  }
  function close() { dialog.current?.close(); }
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  if (!album.photos.length) return <div className="album-empty"><p>这一页先留着，等下一张照片。</p></div>;
  return <>
    <div className="album-photo-grid">{album.photos.map((item, index) => <figure key={`${item.url}-${index}`} className="album-photo">
      <button type="button" className="album-photo-button" onClick={event => open(index, event.currentTarget)} aria-label={`查看${item.caption ? `「${item.caption}」` : `${title}的第 ${index + 1} 张照片`}原图`}>
        <img src={item.thumb || item.url} alt={item.caption || `${title}，第 ${index + 1} 张`} width={item.width} height={item.height} loading={index < 3 ? 'eager' : 'lazy'} decoding="async" />
        <span className="album-enlarge" aria-hidden="true"><ArrowUpRight size={20} /></span>
      </button>
      {item.caption?.trim() && <figcaption>{item.caption}</figcaption>}
    </figure>)}</div>
    <dialog ref={dialog} className="album-dialog" aria-label={`${title}，照片查看器`} onClose={() => { setSelected(null); touchStart.current = null; opener.current?.focus({ preventScroll: true }); }} onClick={event => { if (event.currentTarget === event.target) close(); }} onKeyDown={event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); next(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); next(1); }
    }}>
      <button type="button" className="album-dialog-close" aria-label="关闭照片" onClick={close}><X size={23} /></button>
      {photo && <div className="album-dialog-content">
        <div className="album-dialog-top"><span>{title}</span><span role="status" aria-live="polite" aria-atomic="true" className="album-dialog-count"><span className="album-sr-only">第 </span>{(selected ?? 0) + 1}<span aria-hidden="true"> / </span><span className="album-sr-only"> 张，共 </span>{album.photos.length}<span className="album-sr-only"> 张照片</span></span></div>
        <div className="album-dialog-image" aria-busy={!imageState} onTouchStart={event => { if (event.touches.length !== 1) { touchStart.current = null; return; } const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={event => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || event.changedTouches.length !== 1) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) next(dx < 0 ? 1 : -1);
        }} onTouchCancel={() => { touchStart.current = null; }}>
          <img key={`${photo.url}-${retry}`} src={photo.url} alt={photo.caption || `${title}，第 ${(selected ?? 0) + 1} 张`} draggable={false} style={{ visibility: imageState === 'loaded' ? 'visible' : 'hidden' }} onLoad={() => setImageStates(states => ({ ...states, [photo.url]: 'loaded' }))} onError={() => setImageStates(states => ({ ...states, [photo.url]: 'error' }))} />
          {!imageState && <p className="album-image-status" role="status">照片正在加载…</p>}
          {imageState === 'error' && <div className="album-image-status" role="status"><p>这张照片暂时没加载出来。</p><button type="button" onClick={() => { setImageStates(states => { const nextStates = { ...states }; delete nextStates[photo.url]; return nextStates; }); setRetry(value => value + 1); }}>再试一次</button></div>}
        </div>
        <div className="album-dialog-bottom"><div className="album-dialog-caption">{photo.caption?.trim() && <p>{photo.caption}</p>}<a href={photo.url} target="_blank" rel="noopener noreferrer">打开原图 <ArrowUpRight size={13} /></a></div><div className="album-dialog-navigation"><button type="button" aria-label="上一张照片" onClick={() => next(-1)} disabled={album.photos.length < 2}><ArrowLeft size={23} /></button><button type="button" aria-label="下一张照片" onClick={() => next(1)} disabled={album.photos.length < 2}><ArrowRight size={23} /></button></div></div>
      </div>}
    </dialog>
  </>;
}
