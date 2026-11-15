import Link from 'next/link';
import { ViewTransition } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { albums } from '../../data/albums';
import '../../components/atelier/albums.css';
import { AlbumCoverLink } from '../../components/atelier/AlbumNavigation';
import { albumPhotoName, albumTitleName } from '../../lib/album-transition';

export const metadata = {
  title: '相册',
  description: '猫咪、旅行，以及想留下来的日常。',
  alternates: { canonical: '/photowall' },
};

function displayDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : '';
}

export default function PhotoWallPage() {
  const shelf = [...albums].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="album-page album-shelf-page">
      <header className="album-page-heading"><h1>相册<span>。</span></h1><p>一些想留下来的日子。</p></header>
      {shelf.length ? <div className="album-shelf">{shelf.map((album, index) => {
        const title = album.title?.trim() || '相册';
        const cover = album.cover || album.photos[0]?.url;
        const coverIndex = album.photos.findIndex(photo => photo.url === cover);
        const coverPhoto = coverIndex >= 0 ? album.photos[coverIndex] : undefined;
        const coverImage = cover ? <img src={coverPhoto?.thumb || cover} alt={title} width={coverPhoto?.width} height={coverPhoto?.height} loading={index === 0 ? 'eager' : 'lazy'} /> : null;
        const behind = album.photos.find(photo => photo.url !== cover);
        return <article key={album.id} className={`album-shelf-item album-shelf-item-${index % 2}`}>
          <AlbumCoverLink albumId={album.id} photoIndex={coverIndex} href={`/photowall/${encodeURIComponent(album.id)}`} className="album-cover-link" aria-label={`打开相册：${title}`}>
            <div className="album-paper-stack">
              <div className="album-paper-back" aria-hidden="true">{behind && <img src={behind.thumb || behind.url} alt="" loading="lazy" />}</div>
              <div className="album-paper-front">{cover ? coverPhoto ? <ViewTransition name={albumPhotoName(album.id, coverIndex)} share="album-photo" default="none">{coverImage}</ViewTransition> : coverImage : <div className="album-blank-cover"><span>等待下一次按下快门</span></div>}</div>
              <span className="album-cover-arrow" aria-hidden="true"><ArrowUpRight size={22} /></span>
            </div>
            <div className="album-shelf-label"><ViewTransition name={albumTitleName(album.id)} share="album-title" default="none"><h2>{title}</h2></ViewTransition>{displayDate(album.date) && <time dateTime={album.date}>{displayDate(album.date)}</time>}</div>
          </AlbumCoverLink>
          {album.description.trim() && <p className="album-shelf-description">{album.description}</p>}
        </article>;
      })}</div> : <div className="album-empty"><p>相册还空着，新的照片会慢慢来到这里。</p><Link href="/">回到首页</Link></div>}
    </main>
  );
}
