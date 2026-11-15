"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import "./extras.css";

export type JournalEntry = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
};

export default function Journal({
  entries,
  variant = "journal",
}: {
  entries: JournalEntry[];
  variant?: "journal" | "chatter";
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("全部");
  const tags = useMemo(
    () => [...new Set(entries.flatMap((entry) => entry.tags))],
    [entries],
  );
  const results = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (tag === "全部" || entry.tags.includes(tag)) &&
          `${entry.title} ${entry.description} ${entry.tags.join(" ")}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [entries, query, tag],
  );
  const isJournal = variant === "journal";
  return (
    <section className="page-wrap extra-page">
      <header className="extra-heading">
        <span className="eyebrow">
          {isJournal ? "FIELD NOTES / 记录与思考" : "MARGINALIA / 灵感碎片"}
        </span>
        <h1>
          {isJournal ? (
            <>
              想法，
              <br />
              <em>慢慢成形。</em>
            </>
          ) : (
            <>
              留一点空间，
              <br />
              <em>给偶然的想法。</em>
            </>
          )}
        </h1>
        <p>
          {isJournal
            ? "关于 AI、代码与硬件的实践记录。把问题写下来，也把探索的过程留下来。"
            : "不必完整，也不急着有结论。收集日常里值得停留片刻的念头。"}
        </p>
      </header>
      <div className="journal-toolbar">
        <span className="extra-mono">
          {String(entries.length).padStart(2, "0")} ENTRIES
        </span>
        <label className="journal-search">
          <Search size={17} />
          <input
            aria-label="搜索记录"
            placeholder="搜索记录…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      {tags.length > 0 && (
        <div className="journal-tags" aria-label="按标签筛选">
          {["全部", ...tags].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={tag === item}
              onClick={() => setTag(item)}
            >
              {item}
            </button>
          ))}
        </div>
      )}
      {results.length ? (
        <div className="journal-entries">
          {results.map((entry, index) => (
            <Link
              className="journal-entry"
              key={entry.slug}
              href={`/${isJournal ? "posts" : "chatter"}/${entry.slug}`}
            >
              <span className="extra-mono journal-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="journal-meta">
                  <time dateTime={entry.date}>{entry.date.slice(0, 10)}</time>
                  <span>{entry.tags.join(" / ")}</span>
                </div>
                <h2>{entry.title}</h2>
                <p>{entry.description}</p>
              </div>
              <ArrowUpRight aria-hidden="true" size={25} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="extra-empty">
          <span className="extra-empty-mark" aria-hidden="true">
            ✳
          </span>
          <h2>
            {entries.length ? "暂时没有匹配的记录。" : "留白，也是一种开始。"}
          </h2>
          <p>
            {entries.length
              ? "换一个关键词，或选择其他标签。"
              : isJournal
                ? "第一篇记录正在酝酿。先去看看那些已经成形的项目。"
                : "新的想法会慢慢来到这里。"}
          </p>
          {entries.length ? (
            <button
              className="text-link"
              onClick={() => {
                setQuery("");
                setTag("全部");
              }}
            >
              清除筛选 <ArrowUpRight size={17} />
            </button>
          ) : (
            <Link className="text-link" href="/projects">
              探索项目 <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
