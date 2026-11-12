'use client';
import * as React from 'react';
import { useHydrated } from '../motion-primitives/use-hydrated';
import { type HeroPiece, type HeroPieceClip, HERO_PIECE_NARROW, HERO_PIECE_PLAYS } from './hero-piece-params';

const subscribe = (query: string) => (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const subscribeNarrow = subscribe(HERO_PIECE_NARROW);
const subscribePlays = subscribe(HERO_PIECE_PLAYS);

/** VP9 WebM where the browser plays it and the clip has one, else the H.264 MP4. */
function source(clip: HeroPieceClip): string {
  if (clip.webm && document.createElement('video').canPlayType('video/webm; codecs="vp9"') === 'probably') return clip.webm;
  return clip.mp4;
}

/**
 * The intro and idle files to play for this viewport, with their poster, or `null` to show only the
 * still: on the server and during hydration (so the server HTML never carries a video, and nothing
 * mismatches), wherever `HERO_PIECE_PLAYS` fails (reduced motion: autoplay is motion nobody asked for),
 * and before the clips exist. The same query picks the first paint (HeroPieceFrame), so where this
 * returns clips, the page is already showing the intro's first frame.
 */
export function useHeroPieceClips(piece: HeroPiece): { intro: string; idle: string; poster: string } | null {
  const hydrated = useHydrated();
  const plays = React.useSyncExternalStore(subscribePlays, () => window.matchMedia(HERO_PIECE_PLAYS).matches, () => false);
  const narrow = React.useSyncExternalStore(subscribeNarrow, () => window.matchMedia(HERO_PIECE_NARROW).matches, () => false);
  const { clips, opening, still, stillPortrait } = piece;
  return React.useMemo(() => {
    if (!hydrated || !plays || !clips?.portrait) return null;
    return narrow
      ? { intro: source(clips.portrait.intro), idle: source(clips.portrait.idle), poster: opening?.portrait ?? stillPortrait }
      : { intro: source(clips.intro), idle: source(clips.idle), poster: opening?.wide ?? still };
  }, [hydrated, plays, clips, narrow, opening, still, stillPortrait]);
}
