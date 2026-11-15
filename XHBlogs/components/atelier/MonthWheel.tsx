'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import styles from './MonthWheel.module.css';

export type DiaryPeriod = { year: string; month: string };
type MonthOption = { key: string; year: string; month: string; label: string; aside: string };
const ROW_HEIGHT = 42;
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export function buildMonthOptions(periods: DiaryPeriod[]): MonthOption[] {
  const unique = [...new Set(periods.filter(period => /^\d{4}$/.test(period.year) && /^(0[1-9]|1[0-2])$/.test(period.month)).map(period => `${period.year}-${period.month}`))].sort().reverse();
  const result: MonthOption[] = [{ key: '', year: '', month: '', label: '全部日期', aside: '慢慢翻阅' }];
  let currentYear = '';
  for (const key of unique) {
    const [year, month] = key.split('-');
    if (year !== currentYear) {
      result.push({ key: `${year}-all`, year, month: '', label: `${year} 年`, aside: '全年' });
      currentYear = year;
    }
    result.push({ key, year, month, label: MONTH_NAMES[Number(month) - 1], aside: year });
  }
  return result;
}

export default function MonthWheel({ periods, year, month, onChange }: {
  periods: DiaryPeriod[]; year: string; month: string;
  onChange: (year: string, month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmatic = useRef(false);
  const firstPosition = useRef(true);
  const id = useId().replace(/:/g, '');
  const options = useMemo(() => buildMonthOptions(periods), [periods]);
  const years = useMemo(() => options.filter(option => option.year && !option.month).map(option => option.year), [options]);
  const requestedKey = year ? `${year}-${month || 'all'}` : '';
  const requestedIndex = options.findIndex(option => option.key === requestedKey);
  const index = requestedIndex >= 0 ? requestedIndex : Math.max(0, options.findIndex(option => option.key === `${year}-all`));
  const selected = options[index];
  const current = useRef({ options, index, onChange });
  current.current = { options, index, onChange };

  // A collection change must never leave an unavailable month selected.
  useEffect(() => {
    if (requestedIndex < 0) onChange(selected.year, selected.month);
  }, [requestedIndex, selected.year, selected.month, onChange]);

  useEffect(() => {
    if (!open) { firstPosition.current = true; return; }
    const element = wheel.current;
    if (!element) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    if (programTimer.current) clearTimeout(programTimer.current);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const immediate = firstPosition.current || reduced;
    firstPosition.current = false;
    programmatic.current = true;
    element.scrollTo({ top: index * ROW_HEIGHT, behavior: immediate ? 'instant' : 'smooth' });
    setPosition(index);
    programTimer.current = setTimeout(() => { programmatic.current = false; }, immediate ? 50 : 400);
  }, [open, index, options]);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    if (programTimer.current) clearTimeout(programTimer.current);
  }, []);

  function select(nextIndex: number) {
    const next = current.current.options[Math.max(0, Math.min(current.current.options.length - 1, nextIndex))];
    current.current.onChange(next.year, next.month);
  }
  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function interruptProgrammaticScroll() {
    // Native wheel/touch scroll belongs exclusively to this small, opened reel.
    if (programTimer.current) clearTimeout(programTimer.current);
    programmatic.current = false;
  }
  function handleScroll() {
    const element = wheel.current;
    if (!element) return;
    const nextPosition = element.scrollTop / ROW_HEIGHT;
    setPosition(nextPosition);
    if (programmatic.current) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!wheel.current || programmatic.current) return;
      const nearest = Math.round(wheel.current.scrollTop / ROW_HEIGHT);
      if (nearest !== current.current.index) select(nearest);
    }, 150);
  }

  if (!years.length) return null;
  const label = year ? month ? `${year} 年 · ${Number(month)} 月` : `${year} 年 · 全部` : '全部日期';
  return <div className={styles.root} ref={root} onBlur={event => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={event => {
    if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
  }}>
    <button type="button" ref={trigger} className={`${styles.trigger} ${year ? styles.filtered : ''}`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen(value => !value)}>
      <CalendarDays size={15} aria-hidden="true"/><span>{label}</span><ChevronDown size={13} className={open ? styles.chevronOpen : ''} aria-hidden="true"/>
    </button>
    {open && <div id={`${id}-panel`} className={styles.panel} role="group" aria-label="选择日记日期">
      <div className={styles.top}><span>翻到某个月</span><button type="button" className={styles.close} onClick={close} aria-label="收起日期选择"><X size={15}/></button></div>
      <div className={styles.yearRow}><label htmlFor={`${id}-year`}>年份</label><select id={`${id}-year`} value={year} onChange={event => onChange(event.target.value, '')}><option value="">全部年份</option>{years.map(value => <option key={value} value={value}>{value} 年</option>)}</select><span className={styles.hint}>滚动翻阅</span></div>
      <div className={styles.reelFrame}>
        <span className={styles.selectedLine} aria-hidden="true"/>
        <div className={styles.reel} ref={wheel} role="listbox" aria-label="日记月份滚轮" aria-activedescendant={`${id}-option-${index}`} tabIndex={0} onScroll={handleScroll} onWheel={interruptProgrammaticScroll} onTouchStart={interruptProgrammaticScroll} onPointerDown={interruptProgrammaticScroll} onKeyDown={event => {
          const moves: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, PageUp: -5, PageDown: 5 };
          if (event.key in moves) { event.preventDefault(); select(index + moves[event.key]); }
          else if (event.key === 'Home') { event.preventDefault(); select(0); }
          else if (event.key === 'End') { event.preventDefault(); select(options.length - 1); }
          else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); close(); }
        }}>
          {options.map((option, optionIndex) => {
            const distance = Math.min(3, Math.abs(position - optionIndex));
            return <div id={`${id}-option-${optionIndex}`} key={option.key} role="option" aria-selected={optionIndex === index} className={styles.option} onClick={() => select(optionIndex)} style={{ opacity: Math.max(.22, 1 - distance * .26), transform: `scale(${1 - distance * .045})` }}><span>{option.label}</span><small>{option.aside}</small>{optionIndex === index && <Check size={13} aria-hidden="true"/>}</div>;
          })}
        </div>
        <div className={styles.stepControls}><button type="button" aria-label="上一项日期" disabled={index === 0} onClick={() => select(index - 1)}><ChevronUp size={16}/></button><button type="button" aria-label="下一项日期" disabled={index === options.length - 1} onClick={() => select(index + 1)}><ChevronDown size={16}/></button></div>
      </div>
      <div className={styles.footer}><button type="button" onClick={() => { onChange('', ''); close(); }}>查看全部</button><button type="button" className={styles.done} onClick={close}>完成 <Check size={13}/></button></div>
      <details className={styles.direct}><summary>直接选择日期</summary><label className={styles.directLabel} htmlFor={`${id}-direct`}>选择已有记录的月份</label><select id={`${id}-direct`} aria-label="直接选择日记日期" value={selected.key} onChange={event => { const option = options.find(item => item.key === event.target.value); if (option) onChange(option.year, option.month); }}>{options.map(option => <option key={option.key} value={option.key}>{option.year ? option.month ? `${option.year} 年 ${Number(option.month)} 月` : `${option.year} 年全年` : '全部日期'}</option>)}</select></details>
      <span className={styles.srOnly} role="status" aria-live="polite">当前日期：{label}</span>
    </div>}
  </div>;
}
