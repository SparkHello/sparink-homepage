import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Root, Element, ElementContent } from "hast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import frontmatter from "./frontmatter";
import { siteConfig } from "../siteConfig";

type Collection = "posts" | "chatters";
export type ArticleData = {
  title: string;
  description: string;
  slug: string;
  collection: Collection;
  date: string;
  dateLabel: string;
  tags: string[];
  cover?: string;
  html: string;
  minutes: number;
  headings: { id: string; text: string; level: number }[];
};

function validSlug(slug: string) {
  return (
    Boolean(slug) && !slug.startsWith(".") && !/[/\\:\x00-\x1f]/u.test(slug)
  );
}
export function articleSlugs(collection: Collection) {
  const directory = (collection === "posts" ? path.join(process.cwd(), "posts") : path.join(process.cwd(), "chatters"));
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        validSlug(entry.name.slice(0, -3)),
    )
    .map((entry) => ({ slug: entry.name.slice(0, -3) }));
}
function textContent(node: Element | ElementContent): string {
  if (node.type === "text") return node.value;
  return node.type === "element" ? node.children.map(textContent).join("") : "";
}
function safeLink(value: string) {
  const normalized = value.replace(/[\x00-\x20]/g, "").toLowerCase();
  return (
    !/^[a-z][a-z\d+.-]*:/i.test(normalized) ||
    /^(https?|mailto|tel):/.test(normalized)
  );
}
// Studio assets live under /uploads; normalize explicitly site-relative assets to the origin.
function assetUrl(value: string) {
  return /^(\.\/)?(uploads|images|photos)\//.test(value)
    ? `/${value.replace(/^\.\//, "")}`
    : value;
}

export const readArticle = cache(
  async (collection: Collection, slug: string): Promise<ArticleData> => {
    if (!validSlug(slug)) notFound();
    const directory = (collection === "posts" ? path.join(process.cwd(), "posts") : path.join(process.cwd(), "chatters"));
    const filename = path.resolve(directory, `${slug}.md`);
    if (
      path.dirname(filename) !== directory ||
      !fs.existsSync(filename) ||
      !fs.lstatSync(filename).isFile()
    )
      notFound();
    const { data, content } = frontmatter(fs.readFileSync(filename, "utf8"));
    const headings: ArticleData["headings"] = [];
    const ids = new Map<string, number>();
    function articleStructure() {
      return (tree: Root) => {
        function walk(parent: Root | Element) {
          for (const node of parent.children) {
            if (node.type !== "element") continue;
            if (/^h[1-6]$/.test(node.tagName)) {
              const text = textContent(node);
              const base =
                text
                  .toLowerCase()
                  .replace(/[^\p{L}\p{N}\s-]/gu, "")
                  .trim()
                  .replace(/\s+/g, "-") || "section";
              const count = ids.get(base) || 0;
              ids.set(base, count + 1);
              const id = count ? `${base}-${count + 1}` : base;
              node.properties.id = id;
              if (Number(node.tagName[1]) <= 3)
                headings.push({ id, text, level: Number(node.tagName[1]) });
            }
            if (
              node.tagName === "a" &&
              typeof node.properties.href === "string"
            ) {
              if (!safeLink(node.properties.href)) delete node.properties.href;
              else {
                node.properties.href = assetUrl(node.properties.href);
                if (/^https?:\/\//.test(node.properties.href))
                  node.properties.rel = ["noreferrer", "noopener"];
              }
            }
            if (node.tagName === "img") {
              if (typeof node.properties.src === "string") {
                if (!safeLink(node.properties.src)) delete node.properties.src;
                else node.properties.src = assetUrl(node.properties.src);
              }
              node.properties.loading = "lazy";
              node.properties.decoding = "async";
            }
            walk(node);
          }
          parent.children = parent.children.map((node) =>
            node.type === "element" && node.tagName === "table"
              ? {
                  type: "element",
                  tagName: "div",
                  properties: {
                    className: ["article-table-scroll"],
                    tabIndex: 0,
                    role: "region",
                    ariaLabel: "可横向滚动的表格",
                  },
                  children: [node],
                }
              : node,
          );
        }
        walk(tree);
      };
    }
    const html = String(
      await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkRehype)
        .use(rehypeHighlight, { detect: false, ignoreMissing: true })
        .use(rehypeKatex, { strict: "ignore", trust: false })
        .use(articleStructure)
        .use(rehypeStringify)
        .process(content),
    );
    const title =
      typeof data.title === "string" && data.title.trim() ? data.title : slug;
    const description =
      typeof data.description === "string" ? data.description : "";
    const parsedDate = data.date ? new Date(String(data.date)) : null;
    const date =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : "";
    const dateLabel = date
      ? new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "Asia/Shanghai",
        }).format(parsedDate!)
      : "";
    const coverValue =
      typeof data.cover === "string" ? assetUrl(data.cover) : "";
    const cover = /^(https?:\/\/|\/(?!\/))/.test(coverValue)
      ? coverValue
      : undefined;
    const cjkCount = (
      content.match(
        /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu,
      ) || []
    ).length;
    const wordCount = (content.match(/[a-zA-Z0-9]+/g) || []).length;
    return {
      title,
      description,
      slug,
      collection,
      date,
      dateLabel,
      cover,
      html,
      headings,
      tags: Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      minutes: Math.max(1, Math.ceil(cjkCount / 400 + wordCount / 200)),
    };
  },
);
export function articleMetadata(article: ArticleData): Metadata {
  const url = `/${article.collection === "posts" ? "posts" : "chatter"}/${encodeURIComponent(article.slug)}`;
  return {
    title: article.title,
    description:
      article.description ||
      `${article.title} — ${siteConfig.authorName} 的记录与思考。`,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url,
      authors: [siteConfig.authorName],
      publishedTime: article.date || undefined,
      ...(article.cover
        ? { images: [{ url: article.cover, alt: article.title }] }
        : {}),
    },
  };
}
