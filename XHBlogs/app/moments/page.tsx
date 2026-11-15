import fs from "fs";
import path from "path";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import matter from "../../lib/frontmatter";
import "../../components/atelier/extras.css";

export const metadata = {
  title: "生活片刻",
  description: "代码之外的日常，和偶然遇见的风景。",
};

export default function MomentsPage() {
  const directory = path.join(process.cwd(), "moments");
  const moments = fs.existsSync(directory)
    ? fs
        .readdirSync(directory)
        .filter((name) => name.endsWith(".md"))
        .map((name) => {
          const { data, content } = matter(
            fs.readFileSync(path.join(directory, name), "utf8"),
          );
          return {
            id: name,
            date: String(data.date || ""),
            location: String(data.location || ""),
            images: Array.isArray(data.images) ? data.images.map(String) : [],
            content: content.trim(),
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  return (
    <section className="page-wrap extra-page">
      <header className="extra-heading">
        <span className="eyebrow">LIFE, IN BETWEEN / 生活片刻</span>
        <h1>
          代码之外，
          <br />
          <em>生活之中。</em>
        </h1>
        <p>一些遇见，一些停留。把平凡日子里细小的光收集起来。</p>
      </header>
      {moments.length ? (
        <div className="moments-list">
          {moments.map((moment) => (
            <article className="moment-entry" key={moment.id}>
              <div className="journal-meta">
                <time dateTime={moment.date}>{moment.date.slice(0, 10)}</time>
                <span>{moment.location}</span>
              </div>
              <p>{moment.content}</p>
              {moment.images.length > 0 && (
                <div className="moment-images">
                  {moment.images.map((src, index) => (
                    <a
                      href={src}
                      key={`${src}-${index}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={src}
                        loading="lazy"
                        alt={`${moment.location || "生活记录"} · ${index + 1}`}
                      />
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="extra-empty">
          <span className="extra-empty-mark" aria-hidden="true">
            ↗
          </span>
          <h2>故事，正在路上。</h2>
          <p>这里还没有动态。不过，有些风景已经留在相册里。</p>
          <Link href="/photowall" className="text-link">
            打开相册 <ArrowUpRight size={17} />
          </Link>
        </div>
      )}
    </section>
  );
}
