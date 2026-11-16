/**
 * The playground's board (#172, Alex's round 1 picks: Board, Fit, zoom control). The eight components sit on
 * a board bigger than its window, in three columns at desktop design widths (phone widths in a phone-sized
 * window). It opens at Fit, the whole board in view. Visitors drag to move, pinch or ctrl/⌘ + scroll to
 * zoom, or use the − / + / Fit control. A plain scroll still scrolls the page; the arrow keys pan and
 * +, − and 0 zoom when the window has focus.
 */

const COLUMNS = [
  ['hero', 'downloads', 'filters'],
  ['gallery', 'list'],
  ['menu', 'button', 'specs'],
] as const;
const DESKTOP = { widths: [1200, 1200, 760], gap: 120, pad: 140 };
const PHONE = { widths: [375, 375, 375], gap: 96, pad: 96 };
const MAX_ZOOM = 2;
const STEP = 1.25;
/** Where a drag never starts: the components' own controls and sliders. */
const NO_PAN = 'a, button, input, label, select, textarea, [role="button"], [tabindex], .cms-slider_track';

export type Board = {
  zoomBy: (factor: number) => void;
  fit: () => void;
  destroy: () => void;
};

type Camera = { x: number; y: number; z: number };

export function initBoard(root: HTMLElement, onZoom: (percent: number) => void): Board {
  const view = root.querySelector<HTMLElement>('.mpg-view')!;
  const world = root.querySelector<HTMLElement>('.mpg-world')!;
  const items = [...world.querySelectorAll<HTMLElement>('.mpg-item')];
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ac = new AbortController();
  const on = <K extends keyof HTMLElementEventMap>(type: K, fn: (e: HTMLElementEventMap[K]) => void, passive = true) =>
    view.addEventListener(type, fn, { signal: ac.signal, passive });

  let cam: Camera = { x: 0, y: 0, z: 1 };
  let fitted = true;

  function pack() {
    const { widths, gap, pad } = view.clientWidth < 768 ? PHONE : DESKTOP;
    let x = pad;
    let height = 0;
    COLUMNS.forEach((column, i) => {
      let y = pad;
      for (const key of column) {
        const item = items.find((el) => el.dataset.c === key);
        if (!item) continue;
        item.style.width = `${widths[i]}px`;
        item.style.left = `${x}px`;
        item.style.top = `${y}px`;
        y += item.offsetHeight + gap;
      }
      height = Math.max(height, y - gap + pad);
      x += widths[i] + gap;
    });
    world.style.width = `${x - gap + pad}px`;
    world.style.height = `${height}px`;
  }

  // Fit keeps clear of the zoom control (top) and the hint (bottom).
  const INSET = { x: 16, y: 52 };
  const fitZoom = () =>
    Math.min((view.clientWidth - INSET.x * 2) / world.offsetWidth, (view.clientHeight - INSET.y * 2) / world.offsetHeight);
  const minZoom = () => fitZoom() * 0.8;

  function apply(glide: boolean) {
    world.classList.toggle('is-gliding', glide && !reduced());
    world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`;
    root.toggleAttribute('data-zoomed', cam.z > fitZoom() * 1.05);
    onZoom(Math.round(cam.z * 100));
  }

  function fit(glide = true) {
    const z = fitZoom();
    cam = { x: (view.clientWidth - world.offsetWidth * z) / 2, y: (view.clientHeight - world.offsetHeight * z) / 2, z };
    fitted = true;
    apply(glide);
  }

  /** Zooms by `factor` around a point in the window (its centre by default). */
  function zoomAt(factor: number, cx = view.clientWidth / 2, cy = view.clientHeight / 2, glide = false) {
    const z = Math.min(MAX_ZOOM, Math.max(minZoom(), cam.z * factor));
    cam = { x: cx - (cx - cam.x) * (z / cam.z), y: cy - (cy - cam.y) * (z / cam.z), z };
    fitted = false;
    apply(glide);
  }

  function panBy(dx: number, dy: number) {
    cam = { ...cam, x: cam.x + dx, y: cam.y + dy };
    fitted = false;
    apply(false);
  }

  // Drag to move; two fingers pinch.
  const pointers = new Map<number, { x: number; y: number }>();
  let drag: { x: number; y: number; moved: boolean } | null = null;
  let pinch: { d: number; z: number } | null = null;
  const local = (e: PointerEvent) => {
    const r = view.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  on('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointers.set(e.pointerId, local(e));
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: cam.z };
      drag = null;
      return;
    }
    const control = (e.target as Element).closest(NO_PAN);
    if (control && control !== view) return;
    drag = { ...local(e), moved: false };
  });
  on('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    const p = local(e);
    const last = pointers.get(e.pointerId)!;
    pointers.set(e.pointerId, p);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const target = (pinch.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d;
      zoomAt(target / cam.z, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    if (!drag) return;
    if (!drag.moved && Math.hypot(p.x - drag.x, p.y - drag.y) > 4) {
      drag.moved = true;
      view.setPointerCapture(e.pointerId);
      view.classList.add('is-panning');
    }
    if (drag.moved) panBy(p.x - last.x, p.y - last.y);
  });
  const end = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!drag || pointers.size) return;
    if (drag.moved) {
      // The release after a drag is not a click on whatever sits under it.
      const swallow = (ev: Event) => ev.stopPropagation();
      view.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => view.removeEventListener('click', swallow, true), 0);
    }
    drag = null;
    view.classList.remove('is-panning');
  };
  on('pointerup', end);
  on('pointercancel', end);
  on(
    'wheel',
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return; // a plain wheel scrolls the page
      e.preventDefault();
      const r = view.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    },
    false
  );
  on('keydown', (e) => {
    if (e.target !== view) return;
    const pan: Record<string, [number, number]> = { ArrowLeft: [64, 0], ArrowRight: [-64, 0], ArrowUp: [0, 64], ArrowDown: [0, -64] };
    if (pan[e.key]) panBy(...pan[e.key]);
    else if (e.key === '+' || e.key === '=') zoomAt(STEP, undefined, undefined, true);
    else if (e.key === '-') zoomAt(1 / STEP, undefined, undefined, true);
    else if (e.key === '0') fit();
    else return;
    e.preventDefault();
  });

  // Components change height (the filter drawer, the accordion): repack in place. The window resizes: repack and,
  // if still at Fit, fit again.
  const relayout = () => {
    pack();
    if (fitted) fit(false);
    else apply(false);
  };
  const ro = new ResizeObserver(relayout);
  ro.observe(view);
  for (const item of items) ro.observe(item.querySelector('.mos-c') ?? item);

  root.setAttribute('data-ready', '');
  relayout();

  return {
    zoomBy: (factor) => zoomAt(factor, undefined, undefined, true),
    fit: () => fit(true),
    destroy: () => {
      ac.abort();
      ro.disconnect();
      root.removeAttribute('data-ready');
      world.removeAttribute('style');
      for (const item of items) item.removeAttribute('style');
    },
  };
}
