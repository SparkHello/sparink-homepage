import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import type { Root, Element, ElementContent } from 'hast';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import frontmatter from './frontmatter';
import settings from '../data/content-settings.json';

export type DiaryCollection = 'posts' | 'chatters' | 'moments';
export type DiaryImage = { url: string; caption: string };
export type DiaryEntryData = {
  id: string; slug: string; collection: DiaryCollection; href: string;
  title: string; description: string; fullText: string; excerpt: string; html: string;
  date: string; dateLabel: string; dayLabel: string; timeLabel: string;
  year: string; month: string; day: string; timestamp: number;
  createdAt: string; createdTimestamp: number;
  tags: string[]; cover?: string; images: DiaryImage[]; location: string;
  isLong: boolean; headings: { id: string; text: string; level: number }[];
};
export type DiaryMonth = {
  key: string; year: string; month: string; label: string;
  days: { key: string; label: string; entries: DiaryEntryData[] }[];
};

export function validDiarySlug(slug: string) {
  return Boolean(slug) && !slug.startsWith('.') && !/[/\\:\x00-\x1f]/u.test(slug);
}
export function collectionVisible(collection: DiaryCollection) {
  return collection === 'posts' || (collection === 'chatters' ? settings.chatter : settings.moments);
}
function collectionDirectory(collection: DiaryCollection) {
  // Literal directory paths also let the deployment tracer include future Markdown files.
  if (collection === 'posts') return path.join(process.cwd(), 'posts');
  if (collection === 'chatters') return path.join(process.cwd(), 'chatters');
  return path.join(process.cwd(), 'moments');
}
export function diarySlugs(collection: DiaryCollection, includeHidden = false) {
  if (!includeHidden && !collectionVisible(collection)) return [];
  const directory = collectionDirectory(collection);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md') && validDiarySlug(entry.name.slice(0, -3)))
    .map(entry => ({ slug: entry.name.slice(0, -3) }));
}

/** Dates without a timezone belong to Shanghai, regardless of the build machine timezone. */
export function diaryDate(value: unknown, slug = '') {
  const source = typeof value === 'string' ? value.trim() : value instanceof Date ? value.toISOString() : '';
  const candidate = source || slug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '';
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(candidate);
  const empty = { date: '', dateLabel: '未注明日期', dayLabel: '未注明日期', timeLabel: '', year: '', month: '', day: '', timestamp: Number.MIN_SAFE_INTEGER };
  if (!match) return empty;
  const [, y, m, d, hour, minute, second, fraction, zone] = match;
  const calendar = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (calendar.getUTCFullYear() !== Number(y) || calendar.getUTCMonth() + 1 !== Number(m) || calendar.getUTCDate() !== Number(d) || Number(hour || 0) > 23 || Number(minute || 0) > 59 || Number(second || 0) > 59) return empty;
  const normalized = `${y}-${m}-${d}T${hour || '00'}:${minute || '00'}:${second || '00'}${fraction || ''}${zone || '+08:00'}`;
  const instant = new Date(normalized);
  if (Number.isNaN(instant.getTime())) return empty;
  const local = new Date(instant.getTime() + 8 * 60 * 60 * 1000);
  const year = String(local.getUTCFullYear());
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][local.getUTCDay()];
  return {
    date: instant.toISOString(), timestamp: instant.getTime(), year, month, day,
    dateLabel: `${year}年${Number(month)}月${Number(day)}日`,
    dayLabel: `${Number(month)}月${Number(day)}日 ${weekday}`,
    timeLabel: hour ? `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}` : '',
  };
}

export function safeDiaryUrl(value: unknown, image = false): string | undefined {
  if (typeof value !== 'string') return undefined;
  const url = value.trim();
  if (!url || /[\x00-\x1f\\]/.test(url)) return undefined;
  const protocol = url.match(/^([a-z][a-z\d+.-]*):/i)?.[1].toLowerCase();
  if (protocol && !(image ? ['http', 'https'] : ['http', 'https', 'mailto', 'tel']).includes(protocol)) return undefined;
  if (url.startsWith('//')) return undefined;
  if (/^(\.\/)?(uploads|images|photos)\//.test(url)) return `/${url.replace(/^\.\//, '')}`;
  if (image && !protocol && !url.startsWith('/')) return `/${url.replace(/^\.\//, '').replace(/^public\//, '')}`;
  return url;
}
function nodeText(node: Element | ElementContent): string {
  if (node.type === 'text') return node.value;
  if (node.type !== 'element') return '';
  if (node.tagName === 'img') return String(node.properties.alt || '');
  return node.children.map(nodeText).join('');
}

export async function parseDiaryEntry(source: string, collection: DiaryCollection, slug: string): Promise<DiaryEntryData> {
  const { data, content } = frontmatter(source);
  const href = `/${collection === 'chatters' ? 'chatter' : collection}/${encodeURIComponent(slug)}`;
  const headings: DiaryEntryData['headings'] = [];
  const seenImages = new Set<string>();
  let fullText = '';
  const ids = new Map<string, number>();
  function structure() {
    return (tree: Root) => {
      function walk(parent: Root | Element) {
        for (const node of parent.children) {
          if (node.type !== 'element') continue;
          if (/^h[1-6]$/.test(node.tagName)) {
            const text = nodeText(node);
            const base = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
            const count = ids.get(base) || 0; ids.set(base, count + 1);
            const id = `${collection}-${slug}-${base}${count ? `-${count + 1}` : ''}`;
            node.properties.id = id;
            if (Number(node.tagName[1]) <= 3) headings.push({ id, text, level: Number(node.tagName[1]) });
          }
          if (node.tagName === 'a') {
            const safe = safeDiaryUrl(node.properties.href);
            if (!safe) delete node.properties.href;
            else {
              node.properties.href = safe;
              if (/^https?:\/\//.test(safe)) node.properties.rel = ['noopener', 'noreferrer'];
            }
          }
          if (node.tagName === 'img') {
            const safe = safeDiaryUrl(node.properties.src, true);
            if (safe) { node.properties.src = safe; seenImages.add(safe); }
            else delete node.properties.src;
            node.properties.loading = 'lazy'; node.properties.decoding = 'async';
          }
          walk(node);
        }
        parent.children = parent.children.map(node => node.type === 'element' && node.tagName === 'table' ? {
          type: 'element', tagName: 'div', properties: { className: ['article-table-scroll'], tabIndex: 0, role: 'region', ariaLabel: '可横向滚动的表格' }, children: [node],
        } : node);
      }
      // Capture search text before code/math plugins add duplicate presentation nodes.
      fullText = tree.children.map(node => node.type === 'element' ? nodeText(node) : node.type === 'text' ? node.value : '').join('\n').trim();
      walk(tree);
    };
  }
  const html = String(await unified().use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype).use(structure)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true })
    .use(rehypeKatex, { strict: 'ignore', trust: false }).use(rehypeStringify).process(content));
  const images: DiaryImage[] = [];
  for (const item of Array.isArray(data.images) ? data.images : []) {
    const url = safeDiaryUrl(typeof item === 'string' ? item : item?.url || item?.src, true);
    if (url && !seenImages.has(url)) {
      images.push({ url, caption: typeof item?.caption === 'string' ? item.caption : '' });
      seenImages.add(url);
    }
  }
  const cover = safeDiaryUrl(data.cover, true);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const location = typeof data.location === 'string' ? data.location : '';
  const tags = Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [];
  const created = diaryDate(data.createdAt);
  const textLength = [...fullText].length;
  const isLong = textLength > 600 || content.split('\n').filter(line => /^```|^~~~/.test(line)).length >= 2 || headings.length >= 3;
  const excerpt = description || [...fullText].slice(0, 180).join('') + (textLength > 180 ? '…' : '');
  return {
    id: `${collection}/${slug}`, slug, collection, href, title, description, html,
    fullText: [fullText, ...images.map(image => image.caption), location].filter(Boolean).join('\n'),
    excerpt, ...diaryDate(data.date, slug), createdAt: created.date, createdTimestamp: created.timestamp,
    tags, cover: cover && !seenImages.has(cover) ? cover : undefined,
    images, location, isLong, headings,
  };
}

export const readDiaryEntry = cache(async (collection: DiaryCollection, slug: string, includeHidden = false) => {
  if ((!includeHidden && !collectionVisible(collection)) || !validDiarySlug(slug)) return null;
  const directory = collectionDirectory(collection);
  const filename = path.resolve(directory, `${slug}.md`);
  if (path.dirname(filename) !== directory || !fs.existsSync(filename) || !fs.lstatSync(filename).isFile()) return null;
  return parseDiaryEntry(fs.readFileSync(filename, 'utf8'), collection, slug);
});

export async function listDiaryEntries(options: { collections?: DiaryCollection[]; includeHidden?: boolean } = {}) {
  const entries = await Promise.all((options.collections || ['posts', 'chatters', 'moments']).flatMap(collection =>
    diarySlugs(collection, options.includeHidden).map(({ slug }) => readDiaryEntry(collection, slug, options.includeHidden))));
  return entries.filter((entry): entry is DiaryEntryData => Boolean(entry)).sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp > b.timestamp ? -1 : 1;
    if (a.createdTimestamp !== b.createdTimestamp) return a.createdTimestamp > b.createdTimestamp ? -1 : 1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

export { groupDiaryEntries } from './diary-groups';
