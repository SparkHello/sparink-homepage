import Link from 'next/link';
import type { ArticleData } from '../../lib/atelier-article';
import DiaryEntry from './DiaryEntry';
import ReadingMinimap from './ReadingMinimap';
import './article.css';
import './diary.css';
export default function Article({ article }: { article: ArticleData }) {
  return <main className="diary-detail"><Link href="/timeline" className="diary-back">← 返回日记</Link><ReadingMinimap key={article.id} eligible={article.isLong}><DiaryEntry entry={article} expanded detail/></ReadingMinimap><div className="diary-detail-end"><Link href="/timeline">再翻一篇日记 →</Link></div></main>;
}
