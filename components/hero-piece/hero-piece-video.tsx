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

/** How long the intro may take to show its first frame (while the page and the hero are visible) before the hero settles on the still. */
const START_TIMEOUT = 4000;

/**
 * The Hero piece (#146): the intro once, then the idle loop.
 *
 * Where the clips play, the first paint is the intro's own first frame (HeroPieceFrame), and the intro
 * starts as soon as it can, so it takes over with no cut (Alex, 2026-11-13: "start immediately on load -
 * no weird jump cuts"). Under `prefers-reduced-motion`, without JavaScript, on the server and before the
 * clips exist, only the still (the formed A) renders and no video loads. If the intro can't play (an
 * error, autoplay refused, or no frame within START_TIMEOUT of visible time), the player unmounts and the
 * hero settles on the still, so it never sits on the empty opening frame.
 */
export function HeroPieceVideo({ piece }: { piece: HeroPiece }) {
  const clips = useHeroPieceClips(piece);
  const [failed, setFailed] = React.useState(false);
  const playing = clips && !failed;
  return (
    <div className="absolute inset-0" data-hero-piece={playing ? 'playing' : 'still'}>
      <div className="absolute inset-0 z-[1]">
        <HeroPieceFrame piece={piece} settled={failed} />
      </div>
      {playing && (
        <Player key={`${clips.intro} ${clips.idle}`} intro={clips.intro} idle={clips.idle} poster={clips.poster} onFail={() => setFailed(true)} />
      )}
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
function Player({ intro, idle, poster, onFail }: { intro: string; idle: string; poster: string; onFail: () => void }) {
  const introRef = React.useRef<VideoWithFrames>(null);
  const idleARef = React.useRef<VideoWithFrames>(null);
  const idleBRef = React.useRef<VideoWithFrames>(null);
  // The parent passes a fresh callback each render; read it through a ref so playback never restarts.
  const onFailRef = React.useRef(onFail);
  onFailRef.current = onFail;

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

    // The intro couldn't start: hand the hero back to the still (once, and only before anything showed).
    const fail = () => {
      if (!disposed && top === null) onFailRef.current();
    };

    // Off screen, the loop holds still (#177): leaving view pauses whatever is playing, coming back resumes
    // exactly those, so a hand-off in flight picks up where it was. A clip that starts while out of view
    // (a hand-off, or the intro on a load scrolled past the hero) is paused straight away and queued too.
    let inView = true;
    let held: VideoWithFrames[] = [];
    const hold = (v: VideoWithFrames) => {
      v.pause();
      if (!held.includes(v)) held.push(v);
    };
    const onPlay = (event: Event) => {
      if (!inView) hold(event.currentTarget as VideoWithFrames);
    };
    for (const v of all) v.addEventListener('play', onPlay);
    const visibility = new IntersectionObserver(([entry]) => {
      if (disposed || !entry) return;
      if (!entry.isIntersecting) {
        inView = false;
        for (const v of all) if (!v.paused) hold(v);
      } else if (!inView) {
        inView = true;
        const resume = held;
        held = [];
        for (const v of resume) v.play().catch(() => {});
      }
    });
    visibility.observe(clipIntro);

    // Start the intro straight away: the page is already showing its first frame, so it plays from load.
    onFirstFrame(clipIntro, () => {
      if (disposed) return;
      raise(clipIntro);
      watch(clipIntro);
    });
    clipIntro.play().catch(fail);
    clipIntro.addEventListener('error', fail);

    // No frame within START_TIMEOUT of visible time (a stalled network, a throttled background tab that
    // later comes forward): settle on the still rather than hold the empty opening frame.
    let waited = 0;
    let last = performance.now();
    const clock = window.setInterval(() => {
      const now = performance.now();
      if (document.visibilityState === 'visible' && inView) waited += now - last;
      last = now;
      if (top !== null) window.clearInterval(clock);
      else if (waited > START_TIMEOUT) {
        window.clearInterval(clock);
        fail();
      }
    }, 250);

    return () => {
      disposed = true;
      window.clearInterval(clock);
      visibility.disconnect();
      clipIntro.removeEventListener('error', fail);
      for (const v of all) {
        v.removeEventListener('play', onPlay);
        v.pause();
      }
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
