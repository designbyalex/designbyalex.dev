'use client';
import { DURATION, EASE_ENTRANCE, EASE_MICRO } from '@/lib/motion/reduced-motion';
import { cn } from '@/lib/utils';
import { useLenis } from 'lenis/react';
import { type CSSProperties, type ReactNode, createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import './pitch-board.css';

/**
 * The pitch board (#134, "The pitch"): Alex's annotated wireframes of the SSW homepage, on one board with a
 * Before and After switch, as he signed it off on 18 Nov 2026.
 *
 * - Before and After: the old page clears from the bottom up, and the new one rebuilds from the top down.
 * - One note open at a time: the highlight travels between sections and the note unfolds.
 * - Clicking a section opens its note, and a section with several notes steps through them on each click.
 *   The numbers and note titles do the same, and they are the keyboard route.
 * - Nothing plays by itself. When the notes stack under the wireframe, opening one from the wireframe brings it into view.
 *
 * The server HTML is the whole Before board at rest. Under reduced motion every change is instant.
 */

type Side = 'before' | 'after';
type Note = { title: string; text: string };

const NOTES: Record<Side, Note[]> = {
  before: [
    { title: 'Lost control', text: 'Later slides get little engagement, so we can’t control what people see, think and feel in their first 30 seconds.' },
    { title: 'Poor SEO', text: 'Search engines can’t read text inside an image, so that content can’t rank.' },
    {
      title: 'Accessibility issues',
      text: 'Auto-rotation gets in the way of keyboard navigation and screen readers, and makes the page harder for people with cognitive or visual impairments.',
    },
    {
      title: 'Too many service pillars',
      text: 'Fewer choices mean faster decisions (Hick’s Law). Training, Rules and other secondary services belong in the navigation or on their own pages.',
    },
    { title: 'Partnerships and awards', text: 'Enterprise buyers scan for credibility early. Badges and stats prove it faster than body copy.' },
    {
      title: 'Events sidebar',
      text: 'Events earn revenue and build the brand, so they deserve more than a cramped sidebar. A dedicated section with strong visuals should convert better, even without always-visible placement.',
    },
    {
      title: 'Contact section',
      text: 'This section should drive enquiries instead of listing offices. Full details belong on a Contact page, so the close can answer “How do I start?”',
    },
  ],
  after: [
    {
      title: 'Hero',
      text: 'One clear message on load. With no carousel, nothing gets missed and the page loads faster. Giving up the events billboard commits SSW to its most important message.',
    },
    { title: 'Brand positioning', text: 'The heading says what SSW does and earns credibility. The subline turns that into an invitation.' },
    {
      title: 'Service pillars',
      text: 'Three cards scan in seconds. Going from 8 entry points to 3 reduces decision paralysis and leads visitors to SSW’s highest-value services.',
    },
    { title: 'Stats', text: 'Stats and badges let visitors validate SSW in seconds. A client count persuades faster than a paragraph on partnership history.' },
    {
      title: 'AI positioning',
      text: 'Positions SSW as an AI-first consultancy. The full-width break anchors the page and speaks to a real pain point: failed AI projects.',
    },
    { title: 'Featured projects', text: 'Enterprise buyers want to see relevant work before they make contact, so the proof sits on the homepage.' },
    { title: 'Testimonials', text: 'Third-party proof sits beside the work, in the scroll path, so visitors don’t have to go looking for it.' },
    {
      title: 'Team',
      text: 'Consulting is a people business. Showing the senior team signals stability, expertise and personality, and answers “Who will I be working with?”',
    },
    {
      title: 'Why choose SSW?',
      text: 'Turns SSW’s best video into active persuasion. Showing real personality and what SSW stands for signals seniority and accountability.',
    },
    {
      title: 'Upcoming events',
      text: 'Larger cards make room for richer details, imagery and clearer calls to action. Events no longer compete for attention.',
    },
    { title: 'SSW around the globe', text: 'Shows international reach and closes with a clear ask: tell us about your project.' },
  ],
};

const ENTER = `cubic-bezier(${EASE_ENTRANCE.join(', ')})`;
const MICRO = `cubic-bezier(${EASE_MICRO.join(', ')})`;
const OUT = DURATION.routeOut * 1000;
const IN = DURATION.routeIn * 1000;
/** Clear of the site header when a note scrolls into view. */
const HEADER_CLEARANCE = 96;

const isCalm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const all = (selector: string, el: ParentNode) => Array.from(el.querySelectorAll<HTMLElement>(selector));
const stop = (el: Element) => {
  for (const animation of el.getAnimations()) animation.cancel();
};

const boxIn = (el: Element, base: DOMRect) => {
  const r = el.getBoundingClientRect();
  return { left: `${r.left - base.left}px`, top: `${r.top - base.top}px`, width: `${r.width}px`, height: `${r.height}px` };
};

const rise = (el: HTMLElement, delay: number, distance: number) =>
  el.animate(
    [
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'none' },
    ],
    { duration: IN, delay, easing: ENTER, fill: 'backwards' }
  );

type BoardValue = { side: Side; open: number; noteId: (n: number) => string; openFromPage: (n: number) => void };
const BoardContext = createContext<BoardValue | null>(null);

/** One section of the wireframe, with a numbered pin per note. */
function Section({ notes, className, children }: { notes: number[]; className?: string; children: ReactNode }) {
  const board = useContext(BoardContext);
  if (!board) return null;
  const { side, open, noteId, openFromPage } = board;
  return (
    <div
      className={cn('pb-section', className)}
      data-notes={notes.join(' ')}
      data-on={notes.includes(open) ? '' : undefined}
      onClick={(e) => {
        // A pointer extra: the pins and note titles are the keyboard route to the same notes.
        if ((e.target as HTMLElement).closest('button')) return;
        openFromPage(notes[(notes.indexOf(open) + 1) % notes.length]);
      }}
    >
      <span className='pb-pins'>
        {notes.map((n) => (
          <button
            key={n}
            type='button'
            className='pb-pin'
            data-on={n === open ? '' : undefined}
            aria-label={`Note ${n}: ${NOTES[side][n - 1].title}`}
            aria-expanded={n === open}
            aria-controls={noteId(n)}
            onClick={() => openFromPage(n)}
          >
            {n}
          </button>
        ))}
      </span>
      {children}
    </div>
  );
}

const Cells = ({ n, labels = [] }: { n: number; labels?: string[] }) => (
  <div className='pb-cells' style={{ '--n': n } as CSSProperties} aria-hidden={labels.length === 0 || undefined}>
    {Array.from({ length: n }, (_, i) => (
      <span key={i}>{labels[i]}</span>
    ))}
  </div>
);

const Bars = ({ kind, n }: { kind: 'dots' | 'lines' | 'rows' | 'faces'; n: number }) => (
  <span className={`pb-${kind}`} aria-hidden>
    {Array.from({ length: n }, (_, i) => (
      <i key={i} />
    ))}
  </span>
);

const Feature = () => <span className='pb-feature' aria-hidden />;

const BeforePage = () => (
  <>
    <Section notes={[1, 2, 3]} className='pb-hero'>
      <p>Join us at NDC {'{ Sydney }'}</p>
      <Bars kind='dots' n={10} />
    </Section>
    <Section notes={[4]}>
      <Cells n={4} labels={['Web', 'Artificial Intelligence', 'DevOps & Cloud', 'Dynamics 365']} />
      <Cells n={4} labels={['Training', 'Office 365', 'Book an Expert', 'Rules']} />
    </Section>
    <div className='pb-split'>
      <Section notes={[5]}>
        <p>Australia’s Leading AI, .NET and Azure Consultants</p>
        <Bars kind='lines' n={4} />
      </Section>
      <Section notes={[6]}>
        <p>Upcoming Events</p>
        <Bars kind='rows' n={4} />
      </Section>
    </div>
    <Section notes={[7]}>
      <p>Contact Us</p>
      <Bars kind='rows' n={3} />
    </Section>
  </>
);

const AfterPage = () => (
  <>
    <Section notes={[1]} className='pb-hero pb-round'>
      <p>Three decades of enterprise solutions</p>
    </Section>
    <Section notes={[2, 3]}>
      <p>Australia’s leading AI, .NET and Cloud consultants</p>
      <Cells n={3} labels={['Web Development', 'Artificial Intelligence', 'DevOps & Cloud']} />
    </Section>
    <Section notes={[4]}>
      <Cells n={3} labels={['Solutions delivered', 'Happy clients', 'Years experience']} />
    </Section>
    <Section notes={[5]} className='pb-band'>
      <p>AI solutions that deliver, the first time.</p>
    </Section>
    <Section notes={[6]}>
      <p>Featured Projects</p>
      <Feature />
      <Cells n={3} />
    </Section>
    <Section notes={[7]}>
      <p>Testimonials</p>
      <Bars kind='lines' n={2} />
    </Section>
    <Section notes={[8]}>
      <p>We work together to form an amazing collective brain</p>
      <Bars kind='faces' n={4} />
    </Section>
    <Section notes={[9]}>
      <p>Why choose SSW?</p>
      <Feature />
    </Section>
    <Section notes={[10]}>
      <p>Upcoming Events</p>
      <Feature />
      <Cells n={3} />
    </Section>
    <Section notes={[11]}>
      <p>SSW around the globe</p>
      <Bars kind='rows' n={3} />
    </Section>
  </>
);

export function PitchBoard() {
  const root = useRef<HTMLDivElement>(null);
  const fly = useRef<HTMLDivElement>(null);
  const flyTimer = useRef<number | undefined>(undefined);
  const lenis = useLenis();
  const baseId = useId();
  const [side, setSide] = useState<Side>('before');
  const [open, setOpen] = useState<Record<Side, number>>({ before: 1, after: 1 });
  const [spoken, setSpoken] = useState('');

  useEffect(() => () => window.clearTimeout(flyTimer.current), []);

  // Motion that starts from the committed DOM, before the browser paints it.
  const afterCommit = useRef<(() => void) | null>(null);
  useLayoutEffect(() => {
    const run = afterCommit.current;
    afterCommit.current = null;
    run?.();
  });

  const noteIdFor = (s: Side) => (n: number) => `${baseId}-${s}-${n}`;

  /** On stacked layouts the note sits below the wireframe: scroll it to where it will rest once it has unfolded. */
  const reveal = (row: HTMLElement, shift: number, grow: number) => {
    const grid = row.closest('.pb-grid');
    if (!grid || getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length > 1) return;
    const r = row.getBoundingClientRect();
    const top = r.top - shift;
    const bottom = top + r.height + grow;
    let delta = 0;
    if (bottom > window.innerHeight - 16) delta = Math.min(bottom - window.innerHeight + 16, top - HEADER_CLEARANCE);
    else if (top < HEADER_CLEARANCE) delta = top - HEADER_CLEARANCE;
    if (!delta) return;
    if (lenis) lenis.scrollTo(window.scrollY + delta);
    else window.scrollBy(0, delta);
  };

  const openNote = (s: Side, next: number, fromPage: boolean) => {
    const prev = open[s];
    const board = root.current?.querySelector<HTMLElement>(`[data-side="${s}"]`);
    const page = board?.querySelector<HTMLElement>('.pb-page');
    const ring = page?.querySelector<HTMLElement>('.pb-ring');
    if (next === prev || !board || !page || !ring) return;

    const sectionOf = (n: number) => page.querySelector(`[data-notes~="${n}"]`);
    const rowOf = (n: number) => board.querySelector<HTMLElement>(`[data-note="${n}"]`);
    const base = page.getBoundingClientRect();
    const gliding = page.hasAttribute('data-gliding');
    const oldSection = sectionOf(prev);
    const newSection = sectionOf(next);
    const from = gliding ? boxIn(ring, base) : oldSection && boxIn(oldSection, base);

    setOpen((o) => ({ ...o, [s]: next }));
    if (fromPage) setSpoken(`${NOTES[s][next - 1].title}. ${NOTES[s][next - 1].text}`);

    afterCommit.current = () => {
      const nextRow = rowOf(next);
      const prevRow = rowOf(prev);
      if (!nextRow || !prevRow) return;

      if (isCalm()) {
        if (fromPage) reveal(nextRow, 0, 0);
        return;
      }

      // The highlight travels between sections.
      if (from && newSection && (gliding || oldSection !== newSection)) {
        stop(ring);
        page.setAttribute('data-gliding', '');
        const glide = ring.animate([from, boxIn(newSection, base)], { duration: IN, easing: ENTER, fill: 'both' });
        glide.onfinish = () => page.removeAttribute('data-gliding');
      }

      // The new note unfolds as the old one folds away.
      const body = nextRow.querySelector('p');
      const oldBody = prevRow.querySelector('p');
      if (!body || !oldBody) return;
      stop(body);
      const height = body.offsetHeight;
      body.animate(
        [
          { height: 0, paddingBottom: 0, opacity: 0 },
          { height: `${height}px`, paddingBottom: '16px', opacity: 1 },
        ],
        { duration: IN, easing: ENTER }
      );

      prevRow.dataset.closing = '';
      const oldHeight = oldBody.offsetHeight;
      stop(oldBody);
      const fold = oldBody.animate(
        [
          { height: `${oldHeight}px`, paddingBottom: '16px', opacity: 1 },
          { height: 0, paddingBottom: 0, opacity: 0 },
        ],
        {
          duration: OUT + 60,
          easing: MICRO,
          fill: 'both',
        }
      );
      const closed = () => delete prevRow.dataset.closing;
      fold.onfinish = () => {
        closed();
        fold.cancel();
      };
      fold.oncancel = closed;

      if (fromPage) reveal(nextRow, prev < next ? oldHeight : 0, height);
    };
  };

  /** Before and After: the old page clears from the bottom up, and the new one rebuilds from the top down. */
  const switchTo = (next: Side) => {
    const el = root.current;
    const layer = fly.current;
    if (next === side || !el || !layer) return;
    window.clearTimeout(flyTimer.current);
    layer.replaceChildren();
    if (isCalm()) {
      setSide(next);
      return;
    }

    const oldGrid = el.querySelector<HTMLElement>(`[data-side="${side}"] .pb-grid`);
    if (!oldGrid) return;
    const base = el.getBoundingClientRect();
    const oldBox = oldGrid.getBoundingClientRect();
    const oldHeight = el.offsetHeight;
    for (const animation of el.getAnimations({ subtree: true })) animation.cancel();

    const ghost = oldGrid.cloneNode(true) as HTMLElement;
    for (const node of all('[id]', ghost)) node.removeAttribute('id');
    ghost.setAttribute('inert', '');
    Object.assign(ghost.style, { position: 'absolute', left: `${oldBox.left - base.left}px`, top: `${oldBox.top - base.top}px`, width: `${oldBox.width}px` });
    layer.appendChild(ghost);

    setSide(next);
    afterCommit.current = () => {
      const newGrid = el.querySelector<HTMLElement>(`[data-side="${next}"] .pb-grid`);
      if (!newGrid) return;
      const sections = all('.pb-page .pb-section', newGrid);
      el.animate([{ height: `${oldHeight}px` }, { height: `${el.offsetHeight}px` }], { duration: 640, easing: ENTER });
      all('.pb-page .pb-section', ghost)
        .reverse()
        .forEach((section, i) => {
          section.animate(
            [
              { opacity: 1, transform: 'none' },
              { opacity: 0, transform: 'translateY(-10px)' },
            ],
            { duration: OUT, delay: i * 22, easing: MICRO, fill: 'both' }
          );
        });
      for (const notes of all('.pb-notes', ghost)) notes.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OUT, easing: MICRO, fill: 'both' });
      sections.forEach((section, i) => rise(section, 240 + i * 60, 18));
      all('.pb-note', newGrid).forEach((row, i) => rise(row, 300 + i * 32, 8));
      flyTimer.current = window.setTimeout(() => layer.replaceChildren(), 240 + sections.length * 60 + IN + 40);
    };
  };

  return (
    <div className='pb-host w-full'>
      <div ref={root} className='pb' role='group' aria-label='The SSW homepage, before and after the redesign'>
        <div className='pb-switch' role='group' aria-label='Before or after'>
          {(['before', 'after'] as const).map((s) => (
            <button key={s} type='button' aria-pressed={side === s} onClick={() => switchTo(s)}>
              {s === 'before' ? 'Before' : 'After'}
            </button>
          ))}
        </div>

        {(['before', 'after'] as const).map((s) => {
          const noteId = noteIdFor(s);
          return (
            <BoardContext.Provider key={s} value={{ side: s, open: open[s], noteId, openFromPage: (n) => openNote(s, n, true) }}>
              <div data-side={s} hidden={side !== s}>
                <div className='pb-grid'>
                  <div className='pb-page'>
                    <i className='pb-ring' aria-hidden />
                    {s === 'before' ? <BeforePage /> : <AfterPage />}
                  </div>
                  <ol className='pb-notes'>
                    {NOTES[s].map((note, i) => {
                      const n = i + 1;
                      return (
                        <li key={note.title} className='pb-note' data-note={n} data-on={n === open[s] ? '' : undefined}>
                          <button type='button' aria-expanded={n === open[s]} aria-controls={noteId(n)} onClick={() => openNote(s, n, false)}>
                            <span className='pb-n' aria-hidden>
                              {n}
                            </span>
                            <b>{note.title}</b>
                          </button>
                          <p id={noteId(n)}>{note.text}</p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </BoardContext.Provider>
          );
        })}

        <div ref={fly} className='pb-fly' aria-hidden='true' />
        <p className='sr-only' aria-live='polite'>
          {spoken}
        </p>
      </div>
    </div>
  );
}

export default PitchBoard;
