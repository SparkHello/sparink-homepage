import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ArticleData } from "../../lib/atelier-article";
import "./article.css";

export default function Article({ article }: { article: ArticleData }) {
  const back = article.collection === "posts" ? "/timeline" : "/chatter";
  const label = article.collection === "posts" ? "手记" : "灵感碎片";
  return (
    <main className="article-page page-wrap">
      <div className="article-navigation">
        <Link href={back}>
          <ArrowLeft size={15} /> 返回{label}
        </Link>
        <span className="eyebrow">SPARINK / FIELD NOTES</span>
      </div>
      <article>
        <header className="article-heading">
          <p className="section-kicker">
            {article.collection === "posts"
              ? "JOURNAL / 记录与思考"
              : "MARGINALIA / 灵感碎片"}
          </p>
          <h1>{article.title}</h1>
          {article.description && (
            <p className="article-deck">{article.description}</p>
          )}
          <div className="article-meta">
            <span>Sparink</span>
            {article.date && (
              <time dateTime={article.date}>{article.dateLabel}</time>
            )}
            <span>约 {article.minutes} 分钟阅读</span>
          </div>
          {article.tags.length > 0 && (
            <ul className="article-tags" aria-label="文章标签">
              {article.tags.map((tag, index) => (
                <li key={`${tag}-${index}`}>{tag}</li>
              ))}
            </ul>
          )}
        </header>
        {article.cover && (
          <figure className="article-cover">
            <img src={article.cover} alt={article.title} fetchPriority="high" />
          </figure>
        )}
        <div className="article-reading">
          {article.headings.length > 2 && (
            <details className="article-contents">
              <summary>
                这篇记录的目录 <span aria-hidden="true">＋</span>
              </summary>
              <nav aria-label="文章目录">
                <ol>
                  {article.headings.map((heading) => (
                    <li
                      className={`article-toc-level-${heading.level}`}
                      key={heading.id}
                    >
                      <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </details>
          )}
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
          <footer className="article-end">
            <span className="article-end-mark" aria-hidden="true">
              ✳
            </span>
            <p>记录探索的过程，也为下一次思考留下线索。</p>
            <Link href={back}>
              继续阅读{label}
              <ArrowUpRight size={17} />
            </Link>
          </footer>
        </div>
      </article>
    </main>
  );
}
