import type { DiaryEntryData, DiaryMonth } from './diary';
export function groupDiaryEntries(entries: DiaryEntryData[]): DiaryMonth[] {
  const months = new Map<string, DiaryMonth>();
  for (const entry of entries) {
    const key = entry.year ? `${entry.year}-${entry.month}` : 'undated';
    let month = months.get(key);
    if (!month) {
      month = { key, year: entry.year, month: entry.month, label: entry.year ? `${Number(entry.month)}月` : '未注明日期', days: [] };
      months.set(key, month);
    }
    const dayKey = entry.year ? `${key}-${entry.day}` : 'undated';
    let day = month.days.find(item => item.key === dayKey);
    if (!day) { day = { key: dayKey, label: entry.dayLabel, entries: [] }; month.days.push(day); }
    day.entries.push(entry);
  }
  return [...months.values()];
}
