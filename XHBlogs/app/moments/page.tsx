import fs from 'fs';
import path from 'path';
import matter from '../../lib/frontmatter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MomentList from './MomentList';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: "说说",
  description: "生活动态与瞬间记录",
};

export default function MomentsPage() {
  let allMoments: any[] = [];

  try {
    const momentsDirectory = path.join(process.cwd(), 'moments');

    if (fs.existsSync(momentsDirectory)) {
      const fileNames = fs.readdirSync(momentsDirectory).filter(f => f.endsWith('.md'));
      fileNames.forEach(fileName => {
        const fullPath = path.join(process.cwd(), 'moments', fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));

        allMoments.push({
          id: fileName.replace(/\.md$/, ''),
          date: data.date || '1970-01-01',
          location: data.location || '',
          images: data.images || [],
          content: content.trim()
        });
      });
    }

  } catch (e) {
    console.error("读取说说数据失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10 flex flex-col">
      <Navbar />
      <PageTransition>
        <div className="flex-1 flex flex-col">
          <MomentList
            moments={allMoments}
            authorName={siteConfig.authorName}
            avatarUrl={siteConfig.avatarUrl}
          />
        </div>
      </PageTransition>
    </div>
  );
}
