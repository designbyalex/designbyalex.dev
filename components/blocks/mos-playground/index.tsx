'use client';
import { useEffect, useMemo, useRef } from 'react';
import { type Board, initBoard } from './board';
import { initMosKit } from './kit.js';
import { KIT_MARKUP } from './markup';
import './kit.css';
import './board.css';

/**
 * MOS Urban design-system playground (#172): Mos Urban's own components, live, on a #131313 board in the
 * case study's design-system Section, replacing a still image. Eight components as shipped (menu, arrow
 * buttons, download tiles, hero carousel, gallery slider, filter bar, specs accordion, list reveal), with
 * real staging content, each under a Figma-style selection label. Alex's layout picks: a Board that opens
 * at Fit, with a − / + / Fit control.
 *
 * The components are static HTML from the server (markup.ts), readable without JavaScript and at rest from
 * first paint; kit.js adds their behaviour and board.ts the board, both torn down on unmount. Mos's styles
 * are scoped under `.mos` and the canvas under `.mpg`, so nothing leaks into the site.
 */
export function MosPlayground() {
  const ref = useRef<HTMLDivElement>(null);
  const board = useRef<Board | null>(null);
  const zoomOut = useRef<HTMLOutputElement>(null);
  // The components' markup is set once: a re-render must never replace it (and the board and kit wired to it).
  const world = useMemo(() => <div className='mpg-world' dangerouslySetInnerHTML={{ __html: KIT_MARKUP }} />, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const stopKit = initMosKit(root);
    // The readout is written directly, so zooming never re-renders the block.
    board.current = initBoard(root, (percent) => {
      if (zoomOut.current) zoomOut.current.textContent = `${percent}%`;
    });
    return () => {
      board.current?.destroy();
      board.current = null;
      stopKit();
    };
  }, []);

  return (
    <div ref={ref} className='mpg' role='region' aria-label='Mos Urban components, live'>
      <div className='mpg-zoom' role='group' aria-label='Zoom'>
        <button type='button' aria-label='Zoom out' onClick={() => board.current?.zoomBy(1 / 1.25)}>
          −
        </button>
        <output ref={zoomOut} aria-live='polite'>
          100%
        </output>
        <button type='button' aria-label='Zoom in' onClick={() => board.current?.zoomBy(1.25)}>
          +
        </button>
        <button type='button' onClick={() => board.current?.fit()}>
          Fit
        </button>
      </div>
      {/* Focusable so the keyboard can pan (arrows) and zoom (+, −, 0). */}
      <div className='mpg-view' tabIndex={0} aria-label='Board: drag or use the arrow keys to move, plus and minus to zoom'>
        {world}
      </div>
      <p className='mpg-hint' aria-hidden='true'>
        Drag to move around
      </p>
    </div>
  );
}

export default MosPlayground;
