import Journal from '../../components/atelier/Journal';
import { listDiaryEntries } from '../../lib/diary';
export const metadata = { title: '日记', description: '随手记下的日常，按时间慢慢翻阅。', alternates: { canonical: '/timeline' } };
export default async function Timeline() { return <Journal entries={await listDiaryEntries()}/>; }
