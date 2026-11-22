/**
 * The theme switch's boiling circle (#169), Alex's pick on Portfolio Theme Pour Picks, round 5: the new theme
 * opens out from the toggle in a flat circle with a bubbling edge.
 *
 * A View Transition holds the old page as a snapshot while the new page goes live above it, clipped to the
 * circle. The clip is a vector outline traced from a small metaball field each frame, so the edge stays crisp
 * at any size. There is no canvas, and nothing outlives a switch. This file is its own chunk, fetched after
 * hydration.
 */

const NEW_PAGE = '::view-transition-new(root)';
/** The bubbles riding the circle's edge. */
const BUBBLES = 9;
/** How close to the toggle's centre a click counts as a click on it, in CSS px. */
const TOGGLE_RADIUS = 24;

const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;

/** Write the circle and its bubbles into `blobs` as x, y, radius. Returns the circle's radius. */
function placeBlobs(blobs: Float32Array, p: number, t: number, x: number, y: number, reach: number) {
  const R = easeOutCubic(p) * reach * 1.05;
  blobs.set([x, y, R]);
  for (let i = 0; i < BUBBLES; i++) {
    const angle = (i / BUBBLES) * Math.PI * 2 + t * 0.0012 * (i % 2 ? 1 : -1);
    const wobble = 1 + 0.12 * Math.sin(t * 0.008 + i * 1.7);
    blobs[(i + 1) * 3] = x + Math.cos(angle) * R * wobble;
    blobs[(i + 1) * 3 + 1] = y + Math.sin(angle) * R * wobble;
    blobs[(i + 1) * 3 + 2] = R * (0.28 + 0.06 * Math.sin(i * 2.1 + t * 0.006));
  }
  return R;
}

/** Each marching-squares case as pairs of entry and exit edges: 0 top, 1 right, 2 bottom, 3 left. */
const CASES = [[], [3, 0], [0, 1], [3, 1], [1, 2], [3, 0, 1, 2], [0, 2], [3, 2], [2, 3], [2, 0], [0, 1, 2, 3], [2, 1], [1, 3], [1, 0], [0, 3], []];

/** Where the field crosses the outline between two grid points, as a fraction of the way along. */
const crossing = (a: number, b: number) => {
  const from = Math.log(Math.max(a, 1e-4));
  const to = Math.log(Math.max(b, 1e-4));
  return Math.min(1, Math.max(0, -from / (to - from)));
};

/** A tracer for one viewport. The grid overhangs the edges, so every outline closes off screen. */
function createTracer(width: number, height: number) {
  const cell = width < 1024 ? 4 : 6;
  const cols = Math.ceil(width / cell) + 5;
  const rows = Math.ceil(height / cell) + 5;
  const field = new Float32Array(cols * rows);

  return (blobs: Float32Array, R: number) => {
    const [cx, cy] = blobs;
    const inside = (0.9 * R) ** 2;
    const outside = (1.8 * R) ** 2;
    for (let j = 1; j < rows - 1; j++) {
      const y = (j - 2) * cell;
      for (let i = 1; i < cols - 1; i++) {
        const x = (i - 2) * cell;
        const distance = (x - cx) ** 2 + (y - cy) ** 2;
        let value = distance < inside ? 2 : 0;
        if (distance >= inside && distance <= outside) {
          for (let b = 0; b < blobs.length; b += 3) value += blobs[b + 2] ** 2 / ((x - blobs[b]) ** 2 + (y - blobs[b + 1]) ** 2 + 1);
        }
        field[j * cols + i] = value;
      }
    }

    const links = new Map<number, [number, number, number]>();
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i];
        const b = field[j * cols + i + 1];
        const c = field[(j + 1) * cols + i + 1];
        const d = field[(j + 1) * cols + i];
        const segments = CASES[(a >= 1 ? 1 : 0) | (b >= 1 ? 2 : 0) | (c >= 1 ? 4 : 0) | (d >= 1 ? 8 : 0)];
        const x = (i - 2) * cell;
        const y = (j - 2) * cell;
        const point = (edge: number): [number, number, number] => {
          if (edge === 0) return [2 * (j * cols + i), x + crossing(a, b) * cell, y];
          if (edge === 1) return [2 * (j * cols + i + 1) + 1, x + cell, y + crossing(b, c) * cell];
          if (edge === 2) return [2 * ((j + 1) * cols + i), x + crossing(d, c) * cell, y + cell];
          return [2 * (j * cols + i) + 1, x, y + crossing(a, d) * cell];
        };
        for (let s = 0; s < segments.length; s += 2) {
          const from = point(segments[s]);
          links.set(from[0], [point(segments[s + 1])[0], from[1], from[2]]);
        }
      }
    }

    let path = '';
    for (const start of links.keys()) {
      let key = start;
      let command = 'M';
      for (let link = links.get(key); link; link = links.get(key)) {
        links.delete(key);
        path += `${command}${link[1].toFixed(1)} ${link[2].toFixed(1)}`;
        command = 'L';
        key = link[0];
      }
      path += 'Z';
    }
    return `path(evenodd, '${path || 'M0 0'}')`;
  };
}

export interface BoilThemeOptions {
  /** The theme being switched to. */
  dark: boolean;
  /** The centre of the toggle, in viewport px. */
  origin: { x: number; y: number };
  durationMs: number;
  /** Flip the theme. Always called once when the switch starts. */
  applyTheme: () => void;
  /** The toggle was clicked mid-switch. The browser sends such clicks to the page root, past the button. */
  onToggleClick: () => void;
  /** The switch is over and everything it built is gone. */
  onDone: () => void;
}

/** Start the boiling circle. False when the browser can't run it, and the caller swaps the theme itself. */
export function boilTheme({ dark, origin, durationMs, applyTheme, onToggleClick, onDone }: BoilThemeOptions): boolean {
  if (!document.startViewTransition || document.hidden) return false;
  const root = document.documentElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const reach = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y));
  const blobs = new Float32Array((BUBBLES + 1) * 3);
  const trace = createTracer(width, height);

  // Nothing else animates during the swap, and the page stays clickable beneath the snapshots.
  const style = document.createElement('style');
  style.textContent = `*,*::before,*::after{transition:none!important}
::view-transition,::view-transition-group(*),::view-transition-image-pair(*),::view-transition-old(*),::view-transition-new(*){pointer-events:none}
::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}`;
  document.head.append(style);
  // The header joins the page's snapshot, so the circle passes over it with everything else.
  const header = document.querySelector<HTMLElement>('.site-header');
  if (header) header.style.viewTransitionName = 'none';

  let raf = 0;
  let applied = false;
  let finished = false;
  let clip: Animation | null = null;

  const apply = () => {
    if (applied) return;
    applied = true;
    applyTheme();
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(watchdog);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('click', onClick, true);
    apply();
    clip?.cancel();
    style.remove();
    if (header) header.style.viewTransitionName = '';
    onDone();
  };

  const transition = document.startViewTransition(async () => {
    apply();
    // next-themes swaps the class in an effect: the new snapshot waits for it.
    const begun = performance.now();
    while (root.classList.contains('dark') !== dark && performance.now() - begun < 300) {
      await new Promise((resolve) => setTimeout(resolve, 8));
    }
  });
  const skip = () => transition.skipTransition();
  const onVisibility = () => {
    if (document.hidden) skip();
  };
  const onClick = (event: MouseEvent) => {
    if (event.target === root && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) <= TOGGLE_RADIUS) onToggleClick();
  };

  transition.ready
    .then(() => {
      const start = performance.now();
      const first = trace(blobs, placeBlobs(blobs, 0, 0, origin.x, origin.y, reach));
      clip = root.animate({ clipPath: [first, first] }, { duration: durationMs + 1500, fill: 'both', pseudoElement: NEW_PAGE });
      const frame = (now: number) => {
        const elapsed = Math.max(0, now - start);
        const p = Math.min(1, elapsed / durationMs);
        const path = trace(blobs, placeBlobs(blobs, p, elapsed, origin.x, origin.y, reach));
        (clip?.effect as KeyframeEffect | null)?.setKeyframes({ clipPath: [path, path] });
        if (p >= 1) skip();
        else raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    })
    .catch(finish);
  transition.finished.then(finish, finish);

  // A stalled tab must never leave the page frozen on its snapshot.
  const watchdog = window.setTimeout(skip, durationMs + 1500);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('click', onClick, true);
  return true;
}
