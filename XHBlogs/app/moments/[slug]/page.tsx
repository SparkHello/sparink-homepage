import Article from '../../../components/atelier/Article';
import { articleMetadata, articleSlugs, readArticle } from '../../../lib/atelier-article';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return articleSlugs('moments'); }
export async function generateMetadata({ params }: Props) {
  return articleMetadata(await readArticle('moments', (await params).slug));
}
export default async function MomentPage({ params }: Props) {
  return <Article article={await readArticle('moments', (await params).slug)} />;
}
