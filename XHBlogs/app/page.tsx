import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroArt from "../components/atelier/HeroArt";
import DiaryEntry from "../components/atelier/DiaryEntry";
import { listDiaryEntries } from "../lib/diary";
import { albums } from "../data/albums";
import { siteConfig } from "../siteConfig";

export default async function Home() {
  const entries = (await listDiaryEntries()).slice(0, 1);
  const recentAlbums = [...albums].filter((album) => album.photos.length > 0).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);
  return (
    <main className="personal-wrap living-home">
      <section className="living-intro" aria-labelledby="home-title">
        <div className="living-welcome">
          <img className="living-avatar" src={siteConfig.avatarUrl} alt="Sparink 的头像" width={56} height={56} />
          <h1 id="home-title">你好，我是 Sparink。</h1>
          <p>在这里写日记、放照片，<br />留住一些普通的日子。</p>
          <div className="living-shortcuts">
            <Link href="/timeline">翻翻日记 <ArrowRight size={16} /></Link>
            {siteConfig.features.photoWall && <Link href="/photowall">看看相册</Link>}
          </div>
        </div>
        <HeroArt />
      </section>

      <section className="home-diary" aria-labelledby="home-diary-title">
        <div className="living-section-head">
          <h2 id="home-diary-title">最近写下的</h2>
          <Link href="/timeline">往日的日记 <ArrowRight size={15} /></Link>
        </div>
        {entries.length ? entries.map((entry) => <DiaryEntry key={`${entry.collection}-${entry.slug}`} entry={entry} />) : (
          <p className="home-diary-empty">还没有写下日记，先翻翻相册吧。</p>
        )}
      </section>

      {siteConfig.features.photoWall && recentAlbums.length > 0 && (
        <section className="home-albums" aria-labelledby="home-albums-title">
          <div className="living-section-head">
            <h2 id="home-albums-title">留在相册里</h2>
            <Link href="/photowall">所有相册 <ArrowRight size={15} /></Link>
          </div>
          <div className="home-album-pair">
            {recentAlbums.map((album, index) => {
              const first = album.photos.find((photo) => photo.url === album.cover) || album.photos[0];
              const second = album.photos.find((photo) => photo.url !== first.url) || first;
              return (
                <Link href={`/photowall/${encodeURIComponent(album.id)}`} className={`home-album home-album-${index}`} key={album.id}>
                  <div className="home-photo-stack" aria-hidden="true">
                    <img className="stack-back" src={second.thumb || second.url} alt="" loading="lazy" />
                    <img className="stack-front" src={first.thumb || first.url} alt="" loading="lazy" />
                  </div>
                  <div className="home-album-caption"><h3>{album.title.trim() || "相册"}</h3><ArrowRight size={17} /></div>
                  {album.description && <p>{album.description}</p>}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
