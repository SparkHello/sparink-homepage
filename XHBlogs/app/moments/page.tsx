import Journal from '../../components/atelier/Journal';
import { listDiaryEntries } from '../../lib/diary';
export const metadata = { title: '日常', description: '平常日子里的文字和照片。', alternates: { canonical: '/moments' } };
export default async function MomentsPage() { return <Journal entries={await listDiaryEntries({ collections: ['moments'] })} variant="moments"/>; }
