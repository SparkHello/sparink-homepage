import fs from "fs";
import path from "path";
import matter from "../../lib/frontmatter";
import Journal, { type JournalEntry } from "../../components/atelier/Journal";

export const metadata = {
  title: "灵感碎片",
  description: "日常里值得停留片刻的念头。",
};

export default function ChatterPage() {
  const directory = path.join(process.cwd(), "chatters");
  const entries: JournalEntry[] = fs.existsSync(directory)
    ? fs
        .readdirSync(directory)
        .filter((name) => name.endsWith(".md"))
        .map((name) => {
          const { data, content } = matter(
            fs.readFileSync(path.join(directory, name), "utf8"),
          );
          return {
            slug: name.replace(/\.md$/, ""),
            title: String(data.title || "一个小小的想法"),
            date: String(data.date || ""),
            description: String(
              data.description ||
                content.replace(/^#+ .*\n/m, "").slice(0, 160),
            ),
            tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  return <Journal entries={entries} variant="chatter" />;
}
