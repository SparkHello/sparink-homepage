import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { diarySlugs, readDiaryEntry, type DiaryCollection, type DiaryEntryData } from './diary';
import { siteConfig } from '../siteConfig';
export type ArticleData = DiaryEntryData;
export const articleSlugs = diarySlugs;
export async function readArticle(collection: DiaryCollection, slug: string): Promise<ArticleData> {
  const article = await readDiaryEntry(collection, slug);
  if (!article) notFound();
  return article;
}
export function articleMetadata(article: ArticleData): Metadata {
  const title = article.title || (article.date ? `${article.dateLabel}的日记` : '一则日记');
  return {
    title, description: article.description || article.excerpt,
    alternates: { canonical: article.href },
    openGraph: {
      type: 'article', title, description: article.description || article.excerpt,
      url: article.href, authors: [siteConfig.authorName], publishedTime: article.date || undefined,
      ...(article.cover || article.images[0]?.url ? { images: [{ url: article.cover || article.images[0].url, alt: article.title || article.dateLabel }] } : {}),
    },
  };
}
