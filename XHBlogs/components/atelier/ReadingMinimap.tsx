'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, List } from 'lucide-react';
import './reading-minimap.css';

type ReadingPoint = { id: string; label: string; level: number };

function compactText(element: HTMLElement) {
  return (element.textContent || '').replace(/\s+/gu, ' ').trim();
}

function sample<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  return Array.from({ length: limit }, (_, index) => items[Math.round(index * (items.length - 1) / (limit - 1))]);
}

/** A quiet page-edge index, derived entirely from the rendered entry. */
export default function ReadingMinimap({ children, eligible }: { children: ReactNode; eligible: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const componentId = useId();
  const [points, setPoints] = useState<ReadingPoint[]>([]);
  const [activeId, setActiveId] = useState('');
  const [inView, setInView] = useState(false);
  const [desktopLimit, setDesktopLimit] = useState(12);

  useEffect(() => {
    if (!eligible) return;
    const container = root.current;
    const prose = container?.querySelector<HTMLElement>('.diary-prose');
    if (!container || !prose) return;

    let frame = 0;
    let disposed = false;
    let currentTargets: HTMLElement[] = [];
    const assignedIds = new Map<HTMLElement, string>();
    const idPrefix = `reading-${componentId.replace(/[^a-zA-Z0-9_-]/gu, '')}`;

    function updatePosition() {
      frame = 0;
      if (!currentTargets.length) return;
      const bounds = container!.getBoundingClientRect();
      const readingLine = Math.min(180, window.innerHeight * .26);
      setInView(bounds.top < window.innerHeight - 100 && bounds.bottom > readingLine);
      let current = currentTargets[0];
      for (const target of currentTargets) {
        if (target.getBoundingClientRect().top > readingLine) break;
        current = target;
      }
      setActiveId(current.id);
    }

    function schedulePosition() {
      if (!frame) frame = requestAnimationFrame(updatePosition);
    }

    function measure() {
      if (disposed) return;
      const headings = Array.from(prose!.querySelectorAll<HTMLElement>('h1, h2, h3'))
        .filter(element => !element.closest('.footnotes, [data-footnotes]') && compactText(element));
      const plainBlocks = Array.from(prose!.children).filter((element): element is HTMLElement =>
        element instanceof HTMLElement && !element.closest('.footnotes, [data-footnotes]') && /^(P|BLOCKQUOTE|PRE|H[1-3])$/u.test(element.tagName) && compactText(element).length >= 24);
      const candidates = headings.length >= 3 ? headings : sample(plainBlocks, 10);
      const isScrollable = prose!.getBoundingClientRect().height > window.innerHeight + 180;
      // Two lines and a photo never acquire extra navigation chrome.
      if (!isScrollable || candidates.length < 3) {
        currentTargets = [];
        setPoints(previous => previous.length ? [] : previous);
        setInView(false);
        return;
      }
      currentTargets = candidates;
      const nextPoints = candidates.map((element, index) => {
        if (!element.id) {
          let id = `${idPrefix}-${index + 1}`;
          while (document.getElementById(id)) id += '-p';
          element.id = id;
          assignedIds.set(element, id);
        }
        const text = compactText(element);
        const characters = Array.from(text);
        return { id: element.id, label: characters.slice(0, 60).join('') + (characters.length > 60 ? '…' : ''), level: /^H[1-3]$/u.test(element.tagName) ? Number(element.tagName[1]) : 2 };
      });
      setPoints(previous => previous.length === nextPoints.length && previous.every((point, index) => point.id === nextPoints[index].id && point.label === nextPoints[index].label && point.level === nextPoints[index].level) ? previous : nextPoints);
      setDesktopLimit(Math.max(3, Math.min(14, Math.floor((window.innerHeight - 160) / 28))));
      schedulePosition();
    }

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(prose);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', schedulePosition, { passive: true });
    prose.addEventListener('load', measure, true);
    document.fonts.ready.then(() => { if (!disposed) measure(); });
    measure();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', schedulePosition);
      prose.removeEventListener('load', measure, true);
      assignedIds.forEach((id, element) => { if (element.id === id) element.removeAttribute('id'); });
    };
  }, [eligible, componentId]);

  function jump(event: React.MouseEvent<HTMLAnchorElement>, point: ReadingPoint) {
    if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0) return;
    const target = document.getElementById(point.id);
    if (!target || !root.current?.contains(target)) return;
    event.preventDefault();
    if (menu.current) menu.current.open = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = target.getBoundingClientRect().top + window.scrollY - 110;
    window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'instant' : 'smooth' });
    // Make keyboard reading resume at the destination without stealing scroll focus.
    const previousTabIndex = target.getAttribute('tabindex');
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    // Removing tabindex immediately would make Chrome drop focus back to body.
    if (previousTabIndex === null) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    else target.setAttribute('tabindex', previousTabIndex);
  }

  const desktopPoints = sample(points, desktopLimit);
  const activePointIndex = points.findIndex(point => point.id === activeId);
  const currentDesktopPoint = desktopPoints.reduce<ReadingPoint | undefined>((current, point) => points.indexOf(point) <= activePointIndex ? point : current, desktopPoints[0]);
  const desktopIndex = Math.max(0, desktopPoints.findIndex(point => point.id === currentDesktopPoint?.id));

  return <div className="reading-frame" ref={root}>
    {points.length > 0 && <>
      <details className="reading-directory" ref={menu} onKeyDown={event => {
        if (event.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); }
      }}>
        <summary><List size={14} aria-hidden="true"/><span>文章目录</span><ChevronDown size={13} aria-hidden="true"/></summary>
        <nav aria-label="文章目录"><ol>{points.map(point => <li key={point.id} data-level={point.level}><a href={`#${encodeURIComponent(point.id)}`} onClick={event => jump(event, point)} aria-current={point.id === activeId ? 'location' : undefined}>{point.label}</a></li>)}</ol></nav>
      </details>
      <nav className="reading-minimap" aria-label="阅读位置" data-in-view={inView} inert={!inView} style={{ '--reading-active-index': desktopIndex } as CSSProperties}>
        <span className="reading-minimap-indicator" aria-hidden="true"/>
        {desktopPoints.map(point => <a key={point.id} href={`#${encodeURIComponent(point.id)}`} onClick={event => jump(event, point)} aria-label={`定位到：${point.label}`} aria-current={point.id === currentDesktopPoint?.id ? 'location' : undefined} data-level={point.level}>
          <span className="reading-minimap-tick" aria-hidden="true"/>
          <span className="reading-minimap-label" aria-hidden="true">{point.label}</span>
        </a>)}
      </nav>
    </>}
    {children}
  </div>;
}
