'use client';
import { useReducedMotion } from 'motion/react';
import * as React from 'react';
import { autoplayMotion } from '../../lib/motion/reduced-motion';
import { useHydrated } from '../motion-primitives/use-hydrated';
import { type HeroPiece, type HeroPieceClip, HERO_PIECE_NARROW } from './hero-piece-params';

const subscribeNarrow = (cb: () => void) => {
  const mq = window.matchMedia(HERO_PIECE_NARROW);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/** VP9 WebM where the browser plays it and the clip has one, else the H.264 MP4. */
function source(clip: HeroPieceClip): string {
  if (clip.webm && document.createElement('video').canPlayType('video/webm; codecs="vp9"') === 'probably') return clip.webm;
  return clip.mp4;
}

/**
 * The intro and idle files to play for this viewport, or `null` to show only the still: on the server
 * and during hydration (so the server HTML never carries a video, and nothing mismatches), under
 * `prefers-reduced-motion` (autoplay is motion nobody asked for), and before the clips exist.
 */
export function useHeroPieceClips(piece: HeroPiece): { intro: string; idle: string; poster: string } | null {
  const hydrated = useHydrated();
  const reduce = useReducedMotion() ?? false;
  const narrow = React.useSyncExternalStore(subscribeNarrow, () => window.matchMedia(HERO_PIECE_NARROW).matches, () => false);
  const { clips, still, stillPortrait } = piece;
  return React.useMemo(() => {
    if (!hydrated || !clips || !autoplayMotion(reduce, true)) return null;
    if (!narrow) return { intro: source(clips.intro), idle: source(clips.idle), poster: still };
    return clips.portrait ? { intro: source(clips.portrait.intro), idle: source(clips.portrait.idle), poster: stillPortrait } : null;
  }, [hydrated, clips, reduce, narrow, still, stillPortrait]);
}
