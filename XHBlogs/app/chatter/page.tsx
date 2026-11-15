import Journal from '../../components/atelier/Journal';
import { listDiaryEntries } from '../../lib/diary';
export const metadata = { title: '随手记', description: '一些随手写下的小事。', alternates: { canonical: '/chatter' } };
export default async function ChatterPage() { return <Journal entries={await listDiaryEntries({ collections: ['chatters'] })} variant="chatter"/>; }
