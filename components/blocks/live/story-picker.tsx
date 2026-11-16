'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MARK_PATH, MARK_VIEWBOX } from './mark-path';
import './story-picker.css';

/**
 * The live design picker (#191, "Taste stays with me"): a working specimen of the picker Alex makes his
 * design calls in, rebuilt Claude Design-style to his round 4 grill and round 5 picks, in the site's tokens.
 *
 * - A thread of rounds on the left: the agent's options, his note, the agent's reply and its live status.
 *   Notes typed in the composer land in the thread.
 * - Decision tabs as numbered steps, with Prev / Next, above a board that glides to each decision's frame.
 * - The current element can be moved, or resized from its corner handle, with a live W / H / X / Y readout.
 * - Click empty board to drop a numbered pin; its note goes into the thread.
 * - A compact variants strip under the board, to view an option and Pick it.
 * - Fine-tune steppers in a panel that slides in over the board. One Send for the round.
 * - Narrower than 1024px, the board fills the block and the thread is a bottom sheet.
 *
 * Its content is the hero idle-loop round as it happened (Alex's #105 note), as round 5 showed it. The
 * server HTML is the whole picker at rest: thread, tabs, board and strip, readable without JavaScript.
 * Under reduced motion nothing loops or glides.
 */

type Option = { id: string; label: string; suggested?: boolean };
type Decision = { name: string; frame: string; options: Option[]; start: string };
type Rect = { x: number; y: number; w: number; h: number };

const DECISIONS: Decision[] = [
  {
    name: 'Idle loop',
    frame: 'Hero · idle loop',
    start: 'melt7',
    options: [
      { id: 'ripple', label: 'Liquid ripple' },
      { id: 'melt7', label: 'Melt to a ball, 7s', suggested: true },
      { id: 'melt10', label: 'Melt to a ball, 10s' },
    ],
  },
  {
    name: 'Closing line',
    frame: 'Why I rebuilt it · closing line',
    start: 'a',
    options: [
      { id: 'a', label: 'Paying monthly', suggested: true },
      { id: 'b', label: 'Own it, evolve it' },
      { id: 'c', label: 'No closing line' },
    ],
  },
  {
    name: 'Dashboard',
    frame: 'Built while I was away · dashboard',
    start: 'cards',
    options: [
      { id: 'cards', label: 'Cards', suggested: true },
      { id: 'panel', label: 'Single panel' },
      { id: 'timeline', label: 'Timeline' },
    ],
  },
];

/** Where each decision's frame sits on the 1400 × 800 board, and its element's size. */
const FRAMES: Rect[] = [
  { x: 80, y: 90, w: 560, h: 350 },
  { x: 760, y: 90, w: 520, h: 200 },
  { x: 760, y: 420, w: 520, h: 300 },
];

type Message = { who: string; text: string; kind?: 'me' | 'pin' };

const THREAD: Message[] = [
  { who: 'Round 1', text: 'Three idle loops for the hero. I’d go with the liquid ripple.' },
  { who: 'You', text: 'I would like the idle loop to do the same animation in reverse. It goes back to a ball, then back out to triangles.', kind: 'me' },
  { who: 'Round 2', text: 'Built from your note at two speeds. The 7-second one is on the board.' },
];

const TUNE = [
  { key: 'len', label: 'Loop length', step: 0.5, min: 1.5, max: 10, start: 3.5, format: (v: number) => `${v.toFixed(1)}s` },
  { key: 'mk', label: 'A mark size', step: 0.1, min: 0.5, max: 1.6, start: 1, format: (v: number) => v.toFixed(1) },
  { key: 'glow', label: 'Glow', step: 0.05, min: 0, max: 1, start: 0.35, format: (v: number) => v.toFixed(2) },
] as const;

type TuneKey = (typeof TUNE)[number]['key'];

const CLOSING: Record<string, React.ReactNode> = {
  a: (
    <>
      I was paying monthly <span className='sp-em'>for a tool I’d outgrown.</span>
    </>
  ),
  b: (
    <>
      A portfolio I own, <span className='sp-em'>that I can evolve with AI.</span>
    </>
  ),
  c: <span className='sp-none'>(ends on the paragraph)</span>,
};

const readout = (r: Rect) => `W ${Math.round(r.w)} · H ${Math.round(r.h)} · X ${Math.round(r.x)} · Y ${Math.round(r.y)}`;

export function StoryPicker() {
  const board = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const msgs = useRef<HTMLDivElement>(null);
  const note = useRef<HTMLInputElement>(null);

  const [current, setCurrent] = useState(0);
  const [view, setView] = useState(() => DECISIONS.map((d) => d.start));
  const [picked, setPicked] = useState<(string | null)[]>(() => DECISIONS.map(() => null));
  const [els, setEls] = useState<Rect[]>(() => FRAMES.map((f) => ({ x: 0, y: 0, w: f.w, h: f.h })));
  const [pins, setPins] = useState<{ x: number; y: number }[]>([]);
  const [thread, setThread] = useState<Message[]>(THREAD);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [tune, setTune] = useState<Record<TuneKey, number>>(() => Object.fromEntries(TUNE.map((t) => [t.key, t.start])) as Record<TuneKey, number>);
  const [ready, setReady] = useState(false);
  const zoom = useRef(0.5);

  /** Pan and zoom the board so the current decision's frame sits centred, at most 130%. */
  const glide = useCallback(() => {
    const b = board.current;
    const w = world.current;
    if (!b || !w || !b.clientWidth) return;
    const f = FRAMES[current];
    const fh = f.h + 30;
    const z = Math.min(1.3, (b.clientWidth - 80) / f.w, (b.clientHeight - 80) / fh);
    zoom.current = z;
    w.style.transform = `translate(${(b.clientWidth - f.w * z) / 2 - f.x * z}px, ${(b.clientHeight - fh * z) / 2 - f.y * z}px) scale(${z})`;
  }, [current]);

  useLayoutEffect(() => {
    glide();
  }, [glide]);

  useEffect(() => {
    const b = board.current;
    if (!b) return;
    const observer = new ResizeObserver(() => glide());
    observer.observe(b);
    // Glide only after the first placement, so the board doesn't sweep in on load.
    const raf = requestAnimationFrame(() => setReady(true));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [glide]);

  // New thread messages scroll into view inside the thread, never the page.
  const say = (message: Message) => {
    setThread((t) => [...t, message]);
    requestAnimationFrame(() => {
      if (msgs.current) msgs.current.scrollTop = msgs.current.scrollHeight;
    });
  };

  const step = (by: number) => setCurrent((c) => (c + by + DECISIONS.length) % DECISIONS.length);

  const addNote = () => {
    const text = note.current?.value.trim();
    if (!text || !note.current) return;
    say({ who: `You · ${DECISIONS[current].name}`, text, kind: 'me' });
    note.current.value = '';
  };

  const send = () => {
    const n = picked.filter(Boolean).length;
    say({ who: 'Sent', text: `${n} of ${DECISIONS.length} picks and ${pins.length} pin${pins.length === 1 ? '' : 's'} sent for this round.` });
  };

  const dropPin = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-el]')) return;
    const w = world.current;
    if (!w) return;
    const r = w.getBoundingClientRect();
    const z = zoom.current;
    setPins((p) => [...p, { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z }]);
    say({ who: `Pin ${pins.length + 1} · ${DECISIONS[current].name}`, text: 'Pin dropped. Type your note below and press Add.', kind: 'pin' });
    note.current?.focus({ preventScroll: true });
  };

  /** Drag the current element to move it, or its corner handle to resize it. */
  const startDrag = (i: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (i !== current) return;
    e.preventDefault();
    e.stopPropagation();
    const resize = !!(e.target as HTMLElement).closest('[data-handle]');
    const start = { x: e.clientX, y: e.clientY, rect: els[i] };
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) / zoom.current;
      const dy = (ev.clientY - start.y) / zoom.current;
      const next = resize
        ? { ...start.rect, w: Math.max(120, start.rect.w + dx), h: Math.max(80, start.rect.h + dy) }
        : { ...start.rect, x: start.rect.x + dx, y: start.rect.y + dy };
      setEls((all) => all.map((r, j) => (j === i ? next : r)));
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  const decision = DECISIONS[current];
  const stageStyle = { '--len': `${tune.len}s`, '--mk': tune.mk, '--glow': tune.glow } as React.CSSProperties;

  return (
    <div className='sp-host w-full'>
      <div className='sp' data-ready={ready || undefined} data-tune={tuneOpen || undefined} role='region' aria-label='Design picker, live'>
        <div className='sp-top'>
          <span>Hero piece</span>
          <span className='sp-sub'>· round 2</span>
          <span className='sp-gap' />
          <button type='button' className='sp-chip' aria-pressed={tuneOpen} onClick={() => setTuneOpen((o) => !o)}>
            Fine-tune
          </button>
          <button type='button' className='sp-primary' onClick={send}>
            Send picks
          </button>
        </div>

        <aside className='sp-thread' aria-label='Thread'>
          <div ref={msgs} className='sp-msgs' aria-live='polite'>
            {thread.map((m, i) => (
              <div key={i} className={`sp-msg${m.kind ? ` sp-${m.kind}` : ''}`}>
                <span className='sp-who'>{m.who}</span>
                {m.text}
              </div>
            ))}
            <p className='sp-status'>
              <span className='sp-dot' aria-hidden />
              Building option 3…
            </p>
          </div>
          <form
            className='sp-compose'
            onSubmit={(e) => {
              e.preventDefault();
              addNote();
            }}
          >
            <input ref={note} type='text' placeholder='Note, or “show me more”' aria-label='Note' />
            <button type='submit' className='sp-primary' style={{ height: 28, padding: '0 12px' }}>
              Add
            </button>
          </form>
        </aside>

        <div className='sp-main'>
          <div className='sp-tabs' role='tablist' aria-label='Decisions'>
            {DECISIONS.map((d, i) => (
              <button
                key={d.name}
                type='button'
                role='tab'
                className='sp-tab'
                aria-selected={i === current}
                data-done={picked[i] ? '' : undefined}
                onClick={() => setCurrent(i)}
              >
                <span className='sp-n'>{i + 1}</span>
                {d.name}
              </button>
            ))}
            <span className='sp-nav'>
              <button type='button' className='sp-chip' style={{ height: 28 }} onClick={() => step(-1)}>
                ‹ Prev
              </button>
              <button type='button' className='sp-chip' style={{ height: 28 }} onClick={() => step(1)}>
                Next ›
              </button>
            </span>
          </div>

          {/* The board: click empty space to drop a pin (a pointer extra; the composer takes notes from the keyboard). */}
          <div ref={board} className='sp-board' onClick={dropPin}>
            <div ref={world} className='sp-world'>
              {DECISIONS.map((d, i) => {
                const f = FRAMES[i];
                const r = els[i];
                return (
                  <div key={d.name} className='sp-frame' data-current={i === current ? '' : undefined} style={{ left: f.x, top: f.y, width: f.w }}>
                    <p>{d.frame}</p>
                    <div className='sp-box' style={{ height: f.h }}>
                      <div className='sp-el' data-el style={{ left: r.x, top: r.y, width: r.w, height: r.h }} onPointerDown={startDrag(i)}>
                        {i === 0 && (
                          <div className='sp-stage' data-opt={view[0]} style={stageStyle}>
                            <svg className='sp-a' viewBox={MARK_VIEWBOX} aria-hidden>
                              <path fill='currentColor' d={MARK_PATH} />
                            </svg>
                            <div className='sp-ball' />
                          </div>
                        )}
                        {i === 1 && <div className='sp-text'>{CLOSING[view[1]]}</div>}
                        {i === 2 && (
                          <div className='sp-dash' data-opt={view[2]}>
                            <div>
                              <b>8 / 14</b>
                              <span>tickets done</span>
                            </div>
                            <div>
                              <b>34m</b>
                              <span>per ticket</span>
                            </div>
                            <div>
                              <b>3h 24m</b>
                              <span>left</span>
                            </div>
                            <div>
                              <b>$128.72</b>
                              <span>agent cost</span>
                            </div>
                          </div>
                        )}
                        <span className='sp-handle' data-handle aria-hidden />
                        <span className='sp-readout'>{readout(r)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pins.map((p, i) => (
                <span key={i} className='sp-pinmark' style={{ left: p.x, top: p.y }} aria-hidden>
                  {i + 1}
                </span>
              ))}
            </div>
          </div>

          <aside className='sp-side' aria-label='Fine-tune' aria-hidden={!tuneOpen}>
            <h4>Fine-tune · Idle loop</h4>
            {TUNE.map((t) => (
              <div key={t.key} className='sp-step'>
                {t.label}
                <div>
                  <button
                    type='button'
                    aria-label={`${t.label} down`}
                    onClick={() => setTune((v) => ({ ...v, [t.key]: Math.max(t.min, Math.round((v[t.key] - t.step) * 100) / 100) }))}
                  >
                    −
                  </button>
                  <output>{t.format(tune[t.key])}</output>
                  <button
                    type='button'
                    aria-label={`${t.label} up`}
                    onClick={() => setTune((v) => ({ ...v, [t.key]: Math.min(t.max, Math.round((v[t.key] + t.step) * 100) / 100) }))}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </aside>
        </div>

        <div className='sp-strip' role='group' aria-label={`${decision.name} options`}>
          {decision.options.map((o) => (
            <button
              key={o.id}
              type='button'
              className='sp-var'
              aria-pressed={view[current] === o.id}
              data-picked={picked[current] === o.id ? '' : undefined}
              onClick={() => setView((v) => v.map((x, j) => (j === current ? o.id : x)))}
            >
              <span className='sp-th' data-stage={current === 0 ? '' : undefined} />
              <span>
                {o.suggested && <i className='sp-sg' aria-label='suggested' />}
                {o.label}
                {picked[current] === o.id && <span className='text-emphasis'> · picked</span>}
              </span>
            </button>
          ))}
          <button type='button' className='sp-primary' onClick={() => setPicked((p) => p.map((x, j) => (j === current ? view[current] : x)))}>
            Pick
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoryPicker;
