import Link from 'next/link';
import type { DiaryEntryData } from '../../lib/diary';
import DiaryProse from './DiaryProse';
import './article.css';
import './diary.css';

export default function DiaryEntry({ entry, expanded = false, showDate = true, detail = false }: {
  entry: DiaryEntryData; expanded?: boolean; showDate?: boolean; detail?: boolean;
}) {
  const excerptOnly = entry.isLong && !expanded;
  const images = excerptOnly ? entry.images.slice(0, 1) : entry.images;
  const Heading = detail ? 'h1' : 'h2';
  return <article className={`diary-entry${detail ? ' diary-entry-detail' : ''}`} aria-label={entry.title || entry.dateLabel}>
    {(showDate || entry.timeLabel || entry.location) && <div className="diary-entry-meta">
      {showDate && <Link href={entry.href}>{entry.date ? <time dateTime={entry.date}>{entry.dateLabel}{entry.timeLabel ? ` · ${entry.timeLabel}` : ''}</time> : entry.dateLabel}</Link>}
      {!showDate && entry.timeLabel && <Link href={entry.href}><time dateTime={entry.date}>{entry.timeLabel}</time></Link>}
      {entry.location && <span>{entry.location}</span>}
    </div>}
    {entry.title && <Heading className="diary-entry-title">{detail ? entry.title : <Link href={entry.href}>{entry.title}</Link>}</Heading>}
    {entry.cover && <figure className="diary-entry-cover"><a href={entry.cover} target="_blank" rel="noreferrer"><img src={entry.cover} alt={entry.title || '日记中的照片'} loading="lazy" /></a></figure>}
    {excerptOnly ? <p className="diary-excerpt">{entry.excerpt}</p> : <DiaryProse key={entry.id} html={entry.html} />}
    {!entry.html && entry.description && <p className="diary-excerpt">{entry.description}</p>}
    {images.length > 0 && <div className={`diary-entry-images${images.length > 1 ? ' diary-entry-images-multiple' : ''}`}>{images.map((image, index) => <figure key={`${image.url}-${index}`}><a href={image.url} target="_blank" rel="noreferrer"><img src={image.url} alt={image.caption || `日记中的照片 ${index + 1}`} loading="lazy" /></a>{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</div>}
    {excerptOnly && <Link href={entry.href} className="diary-read-more">继续阅读 <span aria-hidden="true">→</span></Link>}
  </article>;
}
