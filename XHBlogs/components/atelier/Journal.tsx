'use client';
import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { DiaryEntryData } from '../../lib/diary';
import { groupDiaryEntries } from '../../lib/diary-groups';
import DiaryEntry from './DiaryEntry';
import './diary.css';
export type JournalEntry = DiaryEntryData;
export default function Journal({ entries, variant = 'journal' }: { entries: DiaryEntryData[]; variant?: 'journal' | 'chatter' | 'moments' }) {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const years = useMemo(() => [...new Set(entries.map(entry => entry.year).filter(Boolean))].sort().reverse(), [entries]);
  const months = useMemo(() => [...new Set(entries.filter(entry => entry.year === year).map(entry => entry.month))].sort().reverse(), [entries, year]);
  const results = useMemo(() => entries.filter(entry => (!year || entry.year === year) && (!month || entry.month === month) && `${entry.title}\n${entry.fullText}\n${entry.tags.join(' ')}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [entries, query, year, month]);
  const groups = useMemo(() => groupDiaryEntries(results), [results]);
  const filtered = Boolean(query || year || month);
  return <main className="diary-archive">
    <header className="diary-header"><h1>{variant === 'chatter' ? '随手记' : variant === 'moments' ? '日常' : '日记'}</h1><p>{variant === 'journal' ? '按时间，翻一翻过去的日子。' : '一些随手写下的小事。'}</p></header>
    {entries.length > 0 && <div className="diary-tools">
      <label className="diary-search"><Search size={16} aria-hidden="true"/><input type="search" aria-label="搜索日记全文" placeholder="在日记里找一找…" value={query} onChange={event => setQuery(event.target.value)}/></label>
      <div className="diary-periods"><select aria-label="按年份查看" value={year} onChange={event => { setYear(event.target.value); setMonth(''); }}><option value="">所有年份</option>{years.map(value => <option key={value} value={value}>{value} 年</option>)}</select><select aria-label="按月份查看" value={month} disabled={!year} onChange={event => setMonth(event.target.value)}><option value="">所有月份</option>{months.map(value => <option key={value} value={value}>{Number(value)} 月</option>)}</select></div>
      {filtered && <button className="diary-clear" onClick={() => { setQuery(''); setYear(''); setMonth(''); }}>清除筛选</button>}
    </div>}
    {groups.length > 0 ? <div className="diary-months">{groups.map((group, index) => <Fragment key={group.key}>
      {group.year !== groups[index - 1]?.year && <h2 className="diary-year">{group.year || '未注明日期'}</h2>}
      {group.month && <h3 className="diary-month" id={`month-${group.key}`}>{group.label}</h3>}
      {group.days.map(day => <section className="diary-day" key={day.key} aria-labelledby={`day-${day.key}`}><h4 className="diary-day-heading" id={`day-${day.key}`}>{day.label}</h4>{day.entries.map(entry => <DiaryEntry key={entry.id} entry={entry} showDate={false}/>)}</section>)}
    </Fragment>)}</div> : <div className="diary-empty" role="status"><p>{entries.length ? '没有找到这段记录，换个词或日期试试。' : '还没有写下日记，先翻翻相册吧。'}</p>{!entries.length && <Link href="/photowall">翻翻相册 →</Link>}</div>}
  </main>;
}
