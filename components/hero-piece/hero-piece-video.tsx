'use client';
import * as React from 'react';
import { HeroPieceFrame } from './hero-piece-frame';
import type { HeroPiece } from './hero-piece-params';
import { useHeroPieceClips } from './use-hero-piece';

/** The renders' frame time (30 fps). */
const FRAME = 1 / 30;

type VideoWithFrames = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number;
};

/**
 * The Hero piece (#146): the intro once, then the idle loop, over the still.
 *
 * The still sits on top until a video has presented a frame, so the hero is never blank: it is the
 * first paint, the loading state and, if a clip fails, what stays. Under `prefers-reduced-motion`, on
 * the server and before the clips exist, only the still renders and no video loads.
 */
export function HeroPieceVideo({ piece }: { piece: HeroPiece }) {
  const clips = useHeroPieceClips(piece);
  return (
    <div className="absolute inset-0" data-hero-piece={clips ? 'playing' : 'still'}>
      <div className="absolute inset-0 z-[1]">
        <HeroPieceFrame piece={piece} />
      </div>
      {clips && <Player key={`${clips.intro} ${clips.idle}`} intro={clips.intro} idle={clips.idle} poster={clips.poster} />}
    </div>
  );
}

/**
 * Three stacked videos: the intro and two copies of the idle. The one showing sits above the still
 * (z 2); the rest wait underneath it (z 0), loaded and parked on frame 0.
 *
 * Hand-off (intro → idle, and idle → idle at each loop): about two frames before the showing clip
 * ends, the next one starts underneath. It comes to the top only when it has presented a frame AND
 * the showing clip has reached its last frame, so neither the intro's tail nor a frame is skipped,
 * and there's no seek, black frame or flash. The swap is one style change in one paint. Both cuts land
 * on the resting A at zero velocity (#105), so a duplicated frame there reads as the hold it already is.
 */
function Player({ intro, idle, poster }: { intro: string; idle: string; poster: string }) {
  const introRef = React.useRef<VideoWithFrames>(null);
  const idleARef = React.useRef<VideoWithFrames>(null);
  const idleBRef = React.useRef<VideoWithFrames>(null);

  React.useEffect(() => {
    const clipIntro = introRef.current;
    const idle0 = idleARef.current;
    const idle1 = idleBRef.current;
    if (!clipIntro || !idle0 || !idle1) return;
    const all: VideoWithFrames[] = [clipIntro, idle0, idle1];
    // Called once the showing clip has presented its last frame (or ended); set up by handOff.
    const done = new Map<HTMLVideoElement, () => void>();
    let top: VideoWithFrames | null = null;
    let disposed = false;

    const raise = (v: VideoWithFrames) => {
      if (top === v) return;
      const prev = top;
      v.style.zIndex = '2';
      if (prev) prev.style.zIndex = '0';
      top = v;
      prev?.pause();
      if (prev && prev !== clipIntro) prev.currentTime = 0;
    };

    const nextOf = (v: HTMLVideoElement): VideoWithFrames => (v === idle0 ? idle1 : idle0);

    // Runs `cb` once `v` has presented a frame (rVFC), or shortly after it starts playing.
    const onFirstFrame = (v: VideoWithFrames, cb: () => void) => {
      if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(() => cb());
      else v.addEventListener('playing', () => requestAnimationFrame(() => requestAnimationFrame(cb)), { once: true });
    };

    // Starts `next` underneath `cur` and raises it once both conditions hold (see above).
    const handOff = (cur: VideoWithFrames, next: VideoWithFrames) => {
      let nextReady = false;
      let curDone = false;
      const tryRaise = () => {
        if (!disposed && nextReady && curDone && top === cur) {
          raise(next);
          watch(next);
        }
      };
      onFirstFrame(next, () => {
        nextReady = true;
        tryRaise();
      });
      const markDone = () => {
        curDone = true;
        tryRaise();
      };
      cur.addEventListener('ended', markDone, { once: true });
      done.set(cur, markDone);
      next.play().catch(() => {});
    };

    // Follows the showing clip frame by frame and starts the hand-off near its end.
    const watch = (v: VideoWithFrames) => {
      const next = nextOf(v);
      if (!v.requestVideoFrameCallback) {
        // No rVFC (older Firefox): hand off on `ended`; the frozen last frame covers the start-up.
        v.addEventListener(
          'ended',
          () => {
            handOff(v, next);
            done.get(v)?.();
          },
          { once: true },
        );
        return;
      }
      let started = false;
      const tick = (meta: { mediaTime: number }) => {
        if (disposed || top !== v) return;
        const left = v.duration - meta.mediaTime;
        if (!started && left <= 2.5 * FRAME) {
          started = true;
          handOff(v, next);
        }
        if (started && left <= 1.5 * FRAME) done.get(v)?.();
        v.requestVideoFrameCallback?.((_, m) => tick(m));
      };
      v.requestVideoFrameCallback((_, m) => tick(m));
    };

    const begin = (v: VideoWithFrames) => {
      onFirstFrame(v, () => {
        if (disposed) return;
        raise(v);
        watch(v);
      });
      v.play().catch(() => {});
    };

    // Start the intro only once it can play through and the page has gone quiet (hydration, fonts, the
    // headline reveal): started during page load it drops frames in its first half second. The still
    // shows meanwhile, and a 1.5s cap keeps a busy page from holding it back for long.
    const whenReady = (v: HTMLVideoElement, cb: () => void) => (v.readyState >= 4 ? cb() : v.addEventListener('canplaythrough', cb, { once: true }));
    const whenIdle = (cb: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 300));

    // A failed intro skips straight to the idle; a failed idle leaves the still showing.
    const onIntroError = () => {
      if (top === null) whenReady(idle0, () => !disposed && top === null && begin(idle0));
    };
    clipIntro.addEventListener('error', onIntroError);
    whenReady(clipIntro, () => whenIdle(() => !disposed && top === null && begin(clipIntro)));
    return () => {
      disposed = true;
      clipIntro.removeEventListener('error', onIntroError);
      for (const v of all) v.pause();
    };
  }, []);

  const video = (ref: React.RefObject<VideoWithFrames>, src: string) => (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      disablePictureInPicture
      aria-hidden
      tabIndex={-1}
      className="absolute inset-0 size-full object-cover"
      style={{ zIndex: 0 }}
    />
  );

  return (
    <>
      {video(introRef, intro)}
      {video(idleARef, idle)}
      {video(idleBRef, idle)}
    </>
  );
}
