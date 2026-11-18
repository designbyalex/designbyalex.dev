'use client';
import * as React from 'react';
import { BRAND_MARK_WIDTH, type BrandMarkPiece } from './brand-mark-pieces';

/** How far from the mark's centre the cursor is felt, in pixels. */
const RADIUS = 140;
/** How far the pieces part at full strength, in the artwork's units. */
const PART = 3;
/** The share of the remaining distance covered per 60Hz frame. */
const LERP = 0.16;
const FRAME_MS = 1000 / 60;
/** The longest step one frame may take, so a stalled frame doesn't jump. */
const MAX_FRAME_MS = 50;
/** Closer than this to its target, a piece has arrived. */
const SETTLE = 0.01;

/** Hover-capable pointers only, and never under reduced motion: anything else keeps the assembled mark. */
const ACTIVE_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

/** Each piece's push away from the cursor (`gain`) and the direction it parts in (`spread`), as Alex picked them. */
const PIECE_MOTION: Record<BrandMarkPiece, { gain: [number, number]; spread: [number, number] }> = {
  left: { gain: [-0.1, -0.06], spread: [-1, 0.4] },
  right: { gain: [-0.1, -0.06], spread: [1, 0.4] },
  top: { gain: [-0.06, -0.12], spread: [0, -1] },
};

type Piece = { element: SVGPathElement; name: BrandMarkPiece; x: number; y: number };
type Reach = { dx: number; dy: number; strength: number; unit: number };

/** Runs the spring for one mark until `stop` is called, which puts the pieces back at rest. */
function trackPointer(svg: SVGSVGElement, pieces: Piece[]) {
  let pointer: { x: number; y: number } | null = null;
  let frame = 0;
  let lastFrame = 0;
  let listening = false;

  const reach = (): Reach | null => {
    if (!pointer) return null;
    const box = svg.getBoundingClientRect();
    if (box.width === 0) return null;
    const dx = pointer.x - (box.left + box.width / 2);
    const dy = pointer.y - (box.top + box.height / 2);
    const strength = 1 - Math.hypot(dx, dy) / RADIUS;
    return strength > 0 ? { dx, dy, strength, unit: BRAND_MARK_WIDTH / box.width } : null;
  };

  const tick = (now: number) => {
    const elapsed = lastFrame ? Math.min(now - lastFrame, MAX_FRAME_MS) : FRAME_MS;
    const blend = 1 - (1 - LERP) ** (elapsed / FRAME_MS);
    const near = reach();
    let moving = false;

    for (const piece of pieces) {
      const { gain, spread } = PIECE_MOTION[piece.name];
      const targetX = near ? (near.dx * gain[0] + spread[0] * PART * near.strength) * near.strength * near.unit : 0;
      const targetY = near ? (near.dy * gain[1] + spread[1] * PART * near.strength) * near.strength * near.unit : 0;
      piece.x += (targetX - piece.x) * blend;
      piece.y += (targetY - piece.y) * blend;

      if (Math.abs(targetX - piece.x) > SETTLE || Math.abs(targetY - piece.y) > SETTLE) {
        moving = true;
      } else {
        piece.x = targetX;
        piece.y = targetY;
      }

      // At rest the piece carries no transform at all, so the mark is exactly its artwork.
      if (piece.x === 0 && piece.y === 0) piece.element.style.removeProperty('transform');
      else piece.element.style.transform = `translate(${piece.x}px, ${piece.y}px)`;
    }

    lastFrame = moving ? now : 0;
    frame = moving ? window.requestAnimationFrame(tick) : 0;
  };

  /** Starts the spring only when there is something to move, so a resting mark never holds a frame loop. */
  const wake = () => {
    if (frame) return;
    if (pieces.every((piece) => piece.x === 0 && piece.y === 0) && !reach()) return;
    frame = window.requestAnimationFrame(tick);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    wake();
  };
  const onPointerLeave = () => {
    pointer = null;
    wake();
  };

  const listen = (on: boolean) => {
    if (on === listening) return;
    listening = on;
    const method = on ? 'addEventListener' : 'removeEventListener';
    window[method]('pointermove', onPointerMove as EventListener, { passive: true });
    // The page can carry the mark under a still cursor.
    window[method]('scroll', wake, { passive: true });
    document.documentElement[method]('pointerleave', onPointerLeave);
  };

  // Only a mark near the viewport listens: the footer's is off screen on most of the page.
  const observer = new IntersectionObserver(
    ([entry]) => {
      listen(entry.isIntersecting);
      if (!entry.isIntersecting) onPointerLeave();
    },
    { rootMargin: `${RADIUS}px` }
  );
  observer.observe(svg);

  return () => {
    observer.disconnect();
    listen(false);
    if (frame) window.cancelAnimationFrame(frame);
    for (const piece of pieces) {
      piece.x = 0;
      piece.y = 0;
      piece.element.style.removeProperty('transform');
    }
  };
}

/**
 * Wraps the Brand mark so its three pieces part and shy away from a cursor within 140px, then spring
 * back when it leaves (#170, Alex's "Part and shy away"). It renders no box of its own, and any other
 * icon picked in Tina simply stays still. Keyboard focus has its own static part in `styles.css`.
 */
export function ShyMark({ children }: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const svg = rootRef.current?.querySelector('svg');
    if (!svg) return;
    const pieces = Array.from(svg.querySelectorAll<SVGPathElement>('[data-mark-piece]')).map(
      (element): Piece => ({ element, name: element.dataset.markPiece as BrandMarkPiece, x: 0, y: 0 })
    );
    if (pieces.length === 0) return;

    const query = window.matchMedia(ACTIVE_QUERY);
    let stop: (() => void) | undefined;
    const sync = () => {
      stop?.();
      stop = query.matches ? trackPointer(svg, pieces) : undefined;
    };
    sync();
    query.addEventListener('change', sync);
    return () => {
      query.removeEventListener('change', sync);
      stop?.();
    };
  }, []);

  return (
    <span ref={rootRef} className='brand-mark contents'>
      {children}
    </span>
  );
}
