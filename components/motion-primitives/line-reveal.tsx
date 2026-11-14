'use client';
import { useInView } from 'motion/react';
import {
  Children,
  cloneElement,
  type CSSProperties,
  type ElementType,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type AnimationEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import { useIsServerRender } from '@/lib/use-is-server-render';

export type LineRevealProps = {
  children: ReactNode;
  className?: string;
  /** Block element to render. Default 'p'. */
  as?: ElementType;
  /**
   * When the lines rise: 'load' from the first paint (above-the-fold text such as the home headline),
   * 'in-view' once the element scrolls into view. Default 'in-view'.
   */
  trigger?: 'load' | 'in-view';
  /** Seconds between lines. Default 0.25. */
  stagger?: number;
  /** Seconds before the first line. Default 0. */
  delay?: number;
  /** Seconds each line takes. Default 1 (the Reference's appear). */
  duration?: number;
  /** How far each line rises from: pixels, or any CSS length such as '0.6em'. Default 60 (the Reference's appear). */
  y?: number | string;
  /** The curve: 'appear' (the Reference's, the home headline) or 'entrance' (case studies, #167). Default 'appear'. */
  ease?: 'appear' | 'entrance';
  /** Fraction of the element in view that starts an 'in-view' reveal. Default 0.5. */
  amount?: number;
} & Record<`data-${string}`, string | undefined>;

const WORD = 'line-reveal-word';

/**
 * Groups the words of `el` into the lines the wrap produced at the current width, writing each word's line
 * index to its `--line`. Plain DOM so the same code runs inline in the server HTML (before first paint) and
 * from the component on the client; `offsetTop` ignores transforms, so it is safe mid-animation.
 */
function groupLines(el: HTMLElement) {
  let top: number | null = null;
  let line = -1;
  for (const word of el.querySelectorAll<HTMLElement>(`.${WORD}`)) {
    if (top === null || Math.abs(word.offsetTop - top) > 1) {
      line += 1;
      top = word.offsetTop;
    }
    word.style.setProperty('--line', String(line));
  }
}

/**
 * groupLines again, self-contained, for the server HTML: it runs as the parser reaches it, on the element
 * just before it, so the lines are grouped before first paint. (Not `groupLines.toString()`: the bundler
 * renames what that closes over.)
 */
const groupLinesScript = `(function(s){var el=s&&s.previousElementSibling;if(!el)return;var t=null,l=-1,w=el.querySelectorAll(".${WORD}");for(var i=0;i<w.length;i++){if(t===null||Math.abs(w[i].offsetTop-t)>1){l++;t=w[i].offsetTop}w[i].style.setProperty("--line",String(l))}})(document.currentScript)`;

/** Wraps each word of every string in `node` in a word span, recursing into host elements (links, highlights). */
function splitWords(node: ReactNode, key = 'w'): ReactNode {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
      .split(/(\s+)/)
      .map((part, i) =>
        part === '' || /^\s+$/.test(part) ? (
          part
        ) : (
          // The line index is written to the DOM by groupLines, never by React, hence the warning suppression.
          <span key={`${key}-${i}`} className={WORD} suppressHydrationWarning>
            {part}
          </span>
        ),
      );
  }
  if (Array.isArray(node)) return Children.map(node, (child, i) => splitWords(child, `${key}-${i}`));
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    if (element.props.children === undefined) return element;
    return cloneElement(element, undefined, splitWords(element.props.children, key));
  }
  return node;
}

/**
 * A run of text split into LineReveal's word spans: TinaMarkdown's `text` override inside a revealing
 * paragraph, so each leaf (bold, links, highlights) keeps its own element around its words.
 */
export function LineWords({ children }: { children?: ReactNode }) {
  return <>{splitWords(children)}</>;
}

/**
 * Line-by-line entrance (#87's home headline; #177): each rendered line fades and rises into place in
 * order. The server HTML already carries the final markup, every word in an inline-block span, so
 * hydration never swaps the text out and the painted text stays the page's LCP candidate. The motion
 * itself is CSS (`[data-line-reveal]` in styles.css), gated on `(scripting: enabled)` and
 * `(prefers-reduced-motion: no-preference)`: without JavaScript or under reduced motion the text is at
 * rest from first paint. Line indices come from the rendered wrap: for a reveal that plays from load an
 * inline script groups the words before first paint; the client regroups on mount and on every resize.
 *
 * Strings inside host elements (links, highlight spans) are split too, so their styling carries over to
 * each word; text stays real text, selectable and read normally by assistive tech.
 */
export function LineReveal({
  children,
  className,
  as: Tag = 'p',
  trigger = 'in-view',
  stagger = 0.25,
  delay = 0,
  duration = 1,
  y = 60,
  ease = 'appear',
  amount = 0.5,
  ...rest
}: LineRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const serverRender = useIsServerRender();
  const inView = useInView(ref, { once: true, amount });
  const play = trigger === 'load' || inView;
  // Once the last line has landed the element goes 'done' and its words are plain text again, so words
  // added later (typing in Tina's live preview) don't rise on their own.
  const [done, setDone] = useState(false);
  const onAnimationEnd = (event: AnimationEvent) => {
    if (event.animationName !== 'line-rise') return;
    const words = ref.current?.querySelectorAll(`.${WORD}`);
    if (words && event.target === words[words.length - 1]) setDone(true);
  };

  // Regroup after every render (live edits change the words) and on every resize.
  useLayoutEffect(() => {
    if (ref.current) groupLines(ref.current);
  });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => groupLines(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = {
    '--line-stagger': `${stagger}s`,
    '--line-delay': `${delay}s`,
    '--line-duration': `${duration}s`,
    '--line-rise-from': typeof y === 'number' ? `${y}px` : y,
    '--line-ease': `var(--motion-ease-${ease})`,
  } as CSSProperties;

  return (
    <Fragment>
      <Tag
        ref={ref}
        className={cn(className)}
        style={style}
        data-line-reveal={done ? 'done' : play ? 'play' : ''}
        onAnimationEnd={onAnimationEnd}
        {...rest}
      >
        {splitWords(children)}
      </Tag>
      {/* Only a reveal that plays from load needs its lines before first paint; an in-view one is grouped
          by the client before it plays, and stays free of a sibling <script> that would break `p + p` rules. */}
      {serverRender && trigger === 'load' && <script dangerouslySetInnerHTML={{ __html: groupLinesScript }} />}
    </Fragment>
  );
}
