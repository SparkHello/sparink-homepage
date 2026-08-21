import fs from 'fs';
import path from 'path';
import matter from '../../lib/frontmatter';

// 引入前台客户端组件
import CreativeWorkshopClient from './CreativeWorkshopClient';

type LocalItem = {
  id: string;
  slug: string;
  title: string;
  type: string;
  date: string;
  cover: string | null;
  content: string;
};

function parseLocalItem(fileName: string, typeName: string, source: string): LocalItem {
  const { data, content } = matter(source);
  const realSlug = fileName.replace(/\.md$/, '');

  return {
    id: data.id || realSlug,
    slug: realSlug,
    title: data.title || '',
    type: typeName,
    date: data.date || '2026-05-01',
    cover: data.cover || data.image || null,
    content: content.trim(),
  };
}

function getPostItems() {
  const directory = path.join(process.cwd(), 'posts');
  try {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory)
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => parseLocalItem(
        fileName,
        'post',
        fs.readFileSync(path.join(process.cwd(), 'posts', fileName), 'utf8'),
      ));
  } catch (error) {
    console.error('读取 posts 失败:', error);
    return [];
  }
}

function getChatterItems() {
  const directory = path.join(process.cwd(), 'chatters');
  try {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory)
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => parseLocalItem(
        fileName,
        'chatter',
        fs.readFileSync(path.join(process.cwd(), 'chatters', fileName), 'utf8'),
      ));
  } catch (error) {
    console.error('读取 chatters 失败:', error);
    return [];
  }
}

function getMomentItems() {
  const directory = path.join(process.cwd(), 'moments');
  try {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory)
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => parseLocalItem(
        fileName,
        'moment',
        fs.readFileSync(path.join(process.cwd(), 'moments', fileName), 'utf8'),
      ));
  } catch (error) {
    console.error('读取 moments 失败:', error);
    return [];
  }
}

export default function CreativeWorkshopPage() {
  const posts = getPostItems();
  const chatters = getChatterItems();
  const moments = getMomentItems();

  return (
    <CreativeWorkshopClient
      posts={posts}
      chatters={chatters}
      moments={moments}
    />
  );
}
