"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { albums } from "../../data/albums";

export default function PhotoWallClient() {
  const [albumId, setAlbumId] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const visible = useMemo(
    () =>
      albums
        .filter((album) => albumId === "all" || album.id === albumId)
        .flatMap((album) =>
          album.photos.map((photo, i) => ({
            ...photo,
            albumTitle: album.title,
            date: album.date,
            id: `${album.id}-${i}`,
          })),
        )
        .filter(
          (photo) =>
            !query.trim() ||
            `${photo.caption || ""} ${photo.albumTitle}`
              .toLowerCase()
              .includes(query.toLowerCase().trim()),
        ),
    [albumId, query],
  );
  const current = selected === null ? null : visible[selected];
  const open = (index: number, trigger: HTMLButtonElement) => {
    returnFocus.current = trigger;
    setSelected(index);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = (direction: number) =>
    setSelected((index) =>
      index === null
        ? null
        : (index + direction + visible.length) % visible.length,
    );
  useEffect(() => {
    if (selected === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [selected]);
  return (
    <main className="page-wrap sp-secondary sp-photo-page">
      <header className="sp-page-intro">
        <div className="eyebrow sp-overline">
          <span className="sp-small-dot" /> A VISUAL JOURNAL
        </div>
        <div className="sp-intro-grid">
          <h1>
            日子很慢，
            <br />
            光影很长<span className="sp-blue">。</span>
          </h1>
          <p>
            途中见过的风景，身边细小的日常。
            <br />
            把一些舍不得忘记的瞬间，放在这里。
            <span className="sp-intro-en">
              Collected moments, quietly kept.
            </span>
          </p>
        </div>
      </header>
      <div className="sp-filter-row sp-photo-filter">
        <div className="sp-filter-list" aria-label="选择相册">
          <button
            type="button"
            aria-pressed={albumId === "all"}
            className={albumId === "all" ? "is-active" : ""}
            onClick={() => setAlbumId("all")}
          >
            全部照片{" "}
            <small>
              {albums.reduce((n, album) => n + album.photos.length, 0)}
            </small>
          </button>
          {albums.map((album) => (
            <button
              key={album.id}
              type="button"
              aria-pressed={albumId === album.id}
              className={albumId === album.id ? "is-active" : ""}
              onClick={() => setAlbumId(album.id)}
            >
              {album.title.replace("🐱", "")}{" "}
              <small>{album.photos.length}</small>
            </button>
          ))}
        </div>
        <label className="sp-photo-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="寻找一个瞬间…"
            aria-label="搜索相册或照片描述"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="清除搜索"
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>
      <div className="sp-photo-meta">
        <span className="eyebrow" aria-live="polite">
          {String(visible.length).padStart(2, "0")} MOMENTS
        </span>
        <span>点击照片，慢慢看。</span>
      </div>
      <div className="sp-photo-masonry">
        {visible.map((photo, index) => (
          <figure key={photo.id} className="sp-photo-item">
            <button
              type="button"
              onClick={(event) => open(index, event.currentTarget)}
              aria-label={`放大照片：${photo.caption || photo.albumTitle}，第 ${index + 1} 张`}
            >
              <img
                src={photo.thumb || photo.url}
                alt={photo.caption || `${photo.albumTitle} · ${index + 1}`}
                width={photo.width || 1200}
                height={photo.height || 1600}
                loading={index < 4 ? "eager" : "lazy"}
                decoding="async"
              />
              <span className="sp-photo-expand">
                <ArrowUpRight size={22} />
              </span>
            </button>
            <figcaption>
              <span>{photo.caption || photo.albumTitle.replace("🐱", "")}</span>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {!visible.length && (
        <div className="sp-empty">
          <span className="eyebrow">NOT FOUND, YET.</span>
          <h2>这一刻，还没找到。</h2>
          <p>换个关键词，或回到全部照片看看。</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setAlbumId("all");
            }}
          >
            查看全部照片 <ArrowRight size={18} />
          </button>
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="sp-lightbox"
        aria-labelledby="sp-photo-caption"
        onClose={() => {
          setSelected(null);
          returnFocus.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
        }}
      >
        <button
          className="sp-lightbox-close"
          type="button"
          onClick={close}
          aria-label="关闭照片"
        >
          <X size={24} />
        </button>
        {current && (
          <div className="sp-lightbox-inner">
            <div className="sp-lightbox-heading">
              <span className="eyebrow">
                {current.albumTitle.replace("🐱", "")}
              </span>
              <span>
                {String((selected || 0) + 1).padStart(2, "0")} /{" "}
                {String(visible.length).padStart(2, "0")}
              </span>
            </div>
            <img
              src={current.url}
              alt={current.caption || current.albumTitle}
            />
            <div className="sp-lightbox-bottom">
              <p id="sp-photo-caption" aria-live="polite">
                {current.caption || current.albumTitle.replace("🐱", "")}
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="上一张照片"
                >
                  <ArrowLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="下一张照片"
                >
                  <ArrowRight size={22} />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}
