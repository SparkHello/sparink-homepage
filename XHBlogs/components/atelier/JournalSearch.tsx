'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import styles from './JournalSearch.module.css';

export default function JournalSearch({ query, onQueryChange, resultCount }: {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef(false);
  const id = useId();
  // A query stays visible until it is deliberately cleared, including on Escape.
  const expanded = open || query.length > 0;

  useEffect(() => {
    if (open) input.current?.focus({ preventScroll: true });
    else if (returnFocus.current) {
      trigger.current?.focus({ preventScroll: true });
      returnFocus.current = false;
    }
  }, [open]);

  function close() {
    if (query) return;
    returnFocus.current = true;
    setOpen(false);
  }

  return <div className={styles.root} data-open={expanded} role="search" aria-label="日记搜索" onKeyDown={event => {
    if (expanded && event.key === 'Escape') {
      // Prevent the native search input from silently clearing an active filter.
      event.preventDefault();
      event.stopPropagation();
      if (!query) close();
    }
  }}>
    <Search className={styles.icon} size={16} aria-hidden="true" />
    <button type="button" ref={trigger} className={styles.trigger} aria-expanded={expanded} aria-controls={`${id}-field`} inert={expanded} onClick={() => setOpen(true)}>找一找</button>
    <div id={`${id}-field`} className={styles.field} inert={!expanded}>
      <label className={styles.srOnly} htmlFor={`${id}-input`}>搜索日记全文</label>
      <input ref={input} id={`${id}-input`} type="search" autoComplete="off" placeholder="在日记里找一找…" value={query} onChange={event => onQueryChange(event.target.value)} />
      {query ? <button type="button" className={styles.action} aria-label="清空搜索词" onClick={() => { onQueryChange(''); input.current?.focus({ preventScroll: true }); }}><X size={15} aria-hidden="true" /></button>
        : <button type="button" className={styles.action} aria-label="收起搜索" onClick={close}><ArrowLeft size={15} aria-hidden="true" /></button>}
    </div>
    <span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{query.trim() ? `找到 ${resultCount} 条记录` : ''}</span>
  </div>;
}
