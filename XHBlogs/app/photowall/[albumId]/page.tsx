import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { albums } from '../../../data/albums';
import AlbumGallery from '../../../components/atelier/AlbumGallery';
import '../../../components/atelier/albums.css';

type Props = { params: Promise<{ albumId: string }> };

export function generateStaticParams() {
  return albums.map(album => ({ albumId: album.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { albumId } = await params;
  const album = albums.find(item => item.id === albumId);
  if (!album) notFound();
  const title = album.title?.trim() || '相册';
  return {
    title,
    description: album.description.trim() || `${title} · Sparink 的相册`,
    alternates: { canonical: `/photowall/${encodeURIComponent(album.id)}` },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { albumId } = await params;
  const album = albums.find(item => item.id === albumId);
  if (!album) notFound();
  const title = album.title?.trim() || '相册';
  const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(album.date);
  return (
    <main className="album-page album-detail-page">
      <Link href="/photowall" className="album-back"><ArrowLeft size={15} />所有相册</Link>
      <header className="album-detail-heading"><div><h1>{title}</h1>{album.description.trim() && <p>{album.description}</p>}</div>{date && <time dateTime={album.date}>{`${date[1]}.${date[2]}.${date[3]}`}</time>}</header>
      <AlbumGallery album={album} />
      <div className="album-detail-end"><Link href="/photowall"><ArrowLeft size={15} />回到相册</Link></div>
    </main>
  );
}
