import Article from "../../../components/atelier/Article";
import {
  articleMetadata,
  articleSlugs,
  readArticle,
} from "../../../lib/atelier-article";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return articleSlugs("posts");
}
export async function generateMetadata({ params }: Props) {
  return articleMetadata(await readArticle("posts", (await params).slug));
}
export default async function PostPage({ params }: Props) {
  return <Article article={await readArticle("posts", (await params).slug)} />;
}
