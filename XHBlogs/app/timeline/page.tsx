import fs from "fs";
import path from "path";
import matter from "../../lib/frontmatter";
import Journal, { type JournalEntry } from "../../components/atelier/Journal";

export const metadata = {
  title: "记录与思考",
  description: "关于 AI、代码与硬件的实践记录。",
};

export default function Timeline() {
  const directory = path.join(process.cwd(), "posts");
  const entries: JournalEntry[] = fs.existsSync(directory)
    ? fs
        .readdirSync(directory)
        .filter((name) => name.endsWith(".md"))
        .map((name) => {
          const { data } = matter(
            fs.readFileSync(path.join(directory, name), "utf8"),
          );
          return {
            slug: name.replace(/\.md$/, ""),
            title: String(data.title || "未命名记录"),
            date: String(data.date || ""),
            description: String(data.description || ""),
            tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
  return <Journal entries={entries} />;
}
