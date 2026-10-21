// Runs inside the page via page.evaluate(), so each function must be self-contained: Playwright
// serialises it with toString(), and nothing from this module's scope exists in the browser.
// It reports DOM facts only; build-snapshot.ts interprets them.
import type { RawCapture, SectionRule } from './raw.ts';

/** Scrolls each video into view, waits, and records whether it is playing. Stores the result on window. */
export async function probeVideosInPage(waitMs: number): Promise<void> {
  const state = new Map<HTMLVideoElement, boolean>();
  for (const v of Array.from(document.querySelectorAll('video'))) {
    v.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, waitMs));
    state.set(v, v.paused);
  }
  (window as any).__parityVideoPaused = state;
  window.scrollTo(0, 0);
}

export function collectInPage(rules: SectionRule[]): RawCapture {
  const sx = window.scrollX;
  const sy = window.scrollY;
  const boxOf = (r: DOMRect) => ({ x: r.left + sx, y: r.top + sy, w: r.width, h: r.height });
  const px = (v: string) => (v === 'normal' || v === '' ? 0 : Number.parseFloat(v));

  // Sections: rules in order, an element claimed by an earlier rule stays with it.
  const sections: RawCapture['sections'] = [];
  const sectionOf = new Map<Element, number>();
  for (const rule of rules) {
    let matches = Array.from(document.querySelectorAll(rule.selector));
    if (rule.outermost) matches = matches.filter((el) => !matches.some((other) => other !== el && other.contains(el)));
    for (const el of matches) {
      if (sectionOf.has(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const name = rule.name ?? el.getAttribute(rule.nameAttribute ?? '') ?? '';
      if (!name) continue;
      sectionOf.set(el, sections.length);
      sections.push({ name, grouped: rule.name !== undefined, box: boxOf(r) });
    }
  }
  const sectionFor = (node: Node | null): number | null => {
    for (let el = node instanceof Element ? node : (node?.parentElement ?? null); el; el = el.parentElement) {
      const i = sectionOf.get(el);
      if (i !== undefined) return i;
    }
    return null;
  };

  // Visibility: effective opacity and the visible part of a rect after overflow clipping.
  const opacityCache = new Map<Element, number>();
  const opacityOf = (el: Element | null): number => {
    if (!el) return 1;
    const hit = opacityCache.get(el);
    if (hit !== undefined) return hit;
    const o = Number(getComputedStyle(el).opacity) * opacityOf(el.parentElement);
    opacityCache.set(el, o);
    return o;
  };
  // Overflow only clips descendants whose containing-block chain passes through the clipping box, so walk
  // that chain, not plain parents: Framer nests absolutely positioned content inside zero-height clip boxes.
  const transformsCB = (cs: CSSStyleDeclaration) =>
    cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none' || /paint|layout|strict|content/.test(cs.contain);
  const positionsCB = (cs: CSSStyleDeclaration) => cs.position !== 'static' || transformsCB(cs);
  const clipOf = (el: Element): { l: number; t: number; r: number; b: number } | null => {
    let clip: { l: number; t: number; r: number; b: number } | null = null;
    let a: Element | null = el;
    while (a && a !== document.documentElement && a !== document.body) {
      const cs = getComputedStyle(a);
      // display: contents and inline boxes generate no clipping box.
      const boxed = cs.display !== 'contents' && cs.display !== 'inline';
      if (boxed && (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.clipPath !== 'none')) {
        const rect = a.getBoundingClientRect();
        clip = clip
          ? { l: Math.max(clip.l, rect.left), t: Math.max(clip.t, rect.top), r: Math.min(clip.r, rect.right), b: Math.min(clip.b, rect.bottom) }
          : { l: rect.left, t: rect.top, r: rect.right, b: rect.bottom };
      }
      let p: Element | null = a.parentElement;
      const escapes = cs.position === 'absolute' ? positionsCB : cs.position === 'fixed' ? transformsCB : null;
      if (escapes) while (p && p !== document.body && !escapes(getComputedStyle(p))) p = p.parentElement;
      a = p;
    }
    return clip;
  };
  const visible = (r: DOMRect, el: Element) => {
    const c = clipOf(el);
    if (!c) return true;
    return Math.min(r.right, c.r) - Math.max(r.left, c.l) > 0.5 && Math.min(r.bottom, c.b) - Math.max(r.top, c.t) > 0.5;
  };

  // Links
  const links: RawCapture['links'] = [];
  const linkOf = new Map<Element, number>();
  for (const a of Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[]) {
    const r = a.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (getComputedStyle(a).visibility === 'hidden') continue;
    linkOf.set(a, links.length);
    links.push({
      text: (a.textContent ?? '').replace(/[ \t\n\r\f]+/g, ' ').trim() || a.getAttribute('aria-label') || '',
      href: a.href,
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
      section: sectionFor(a),
      box: boxOf(r),
    });
  }

  // Text: every text node in document order, grouped by its nearest block-level ancestor.
  const blocks: RawCapture['blocks'] = [];
  const blockOf = new Map<Element, number>();
  const blockFor = (el: Element): number => {
    let b: Element = el;
    while (b.parentElement && /^(inline|contents)/.test(getComputedStyle(b).display) && b !== document.body) b = b.parentElement;
    let i = blockOf.get(b);
    if (i === undefined) {
      i = blocks.length;
      blockOf.set(b, i);
      blocks.push({ tag: b.tagName, section: sectionFor(b), box: boxOf(b.getBoundingClientRect()) });
    }
    return i;
  };
  const styleCache = new Map<Element, RawCapture['fragments'][number]['style']>();
  const styleOf = (el: Element) => {
    let s = styleCache.get(el);
    if (!s) {
      const cs = getComputedStyle(el);
      s = {
        family: cs.fontFamily
          .split(',')[0]
          .trim()
          .replace(/^["']|["']$/g, ''),
        size: px(cs.fontSize),
        lineHeight: cs.lineHeight === 'normal' ? null : px(cs.lineHeight),
        weight: Number(cs.fontWeight),
        tracking: px(cs.letterSpacing),
        color: cs.color,
        transform: cs.textTransform,
        fontStyle: cs.fontStyle,
      };
      styleCache.set(el, s);
    }
    return s;
  };
  const linkFor = (el: Element) => {
    const a = el.closest('a[href]');
    return a ? (linkOf.get(a) ?? null) : null;
  };

  const fragments: RawCapture['fragments'] = [];
  const skip = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TITLE|OPTION)$/;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    const data = n.nodeValue ?? '';
    if (!el || skip.test(el.tagName) || el.closest('svg')) continue;
    if (!data) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    const space = data.trim() === '';
    range.selectNodeContents(n);
    const rects = space ? [] : Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0 && visible(r, el));
    if (!space && rects.length === 0) continue;
    // Invisible text is not copy a visitor reads (Framer keeps opacity-0 duplicates for sizing).
    const opacity = opacityOf(el);
    if (!space && opacity < 0.01) continue;
    fragments.push({
      text: data,
      space,
      block: blockFor(el),
      link: linkFor(el),
      rects: rects.map(boxOf),
      style: styleOf(el),
      opacity,
    });
  }

  // Media: images, videos, iframes and CSS background images.
  const radiusOf = (el: Element) => {
    const own = el.getBoundingClientRect();
    let max = 0;
    for (let a: Element | null = el; a && a !== document.body; a = a.parentElement) {
      const r = a.getBoundingClientRect();
      if (a !== el && (Math.abs(r.width - own.width) > 2 || Math.abs(r.height - own.height) > 2)) break;
      const cs = getComputedStyle(a);
      for (const c of [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius]) max = Math.max(max, px(c));
    }
    return max;
  };
  const media: RawCapture['media'] = [];
  const paused: Map<Element, boolean> | undefined = (window as any).__parityVideoPaused;
  for (const el of Array.from(document.querySelectorAll('img, video, iframe'))) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const base = { section: sectionFor(el), box: boxOf(r), fit: cs.objectFit, radius: radiusOf(el) };
    if (el instanceof HTMLImageElement) {
      media.push({
        kind: 'image',
        src: el.currentSrc || el.src,
        alt: el.getAttribute('alt'),
        natural: el.naturalWidth ? { w: el.naturalWidth, h: el.naturalHeight } : null,
        video: null,
        ...base,
      });
    } else if (el instanceof HTMLVideoElement) {
      media.push({
        kind: 'video',
        src: el.currentSrc || el.src || (el.querySelector('source') as HTMLSourceElement | null)?.src || '',
        alt: el.getAttribute('aria-label'),
        natural: el.videoWidth ? { w: el.videoWidth, h: el.videoHeight } : null,
        video: {
          autoplay: el.autoplay,
          muted: el.muted,
          controls: el.controls,
          loop: el.loop,
          playsInline: el.playsInline,
          poster: el.poster || null,
          pausedAfterView: paused?.get(el) ?? el.paused,
        },
        ...base,
      });
    } else {
      media.push({ kind: 'iframe', src: (el as HTMLIFrameElement).src, alt: el.getAttribute('title'), natural: null, video: null, ...base });
    }
  }
  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    const cs = getComputedStyle(el);
    const m = /url\(["']?(.*?)["']?\)/.exec(cs.backgroundImage);
    if (!m) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden') continue;
    media.push({
      kind: 'background',
      src: new URL(m[1], document.baseURI).href,
      alt: null,
      natural: null,
      video: null,
      section: sectionFor(el),
      box: boxOf(r),
      fit: cs.backgroundSize,
      radius: radiusOf(el),
    });
  }

  const fonts = new Set<string>();
  document.fonts.forEach((f) => {
    if (f.status === 'loaded') fonts.add(f.family.replace(/^["']|["']$/g, ''));
  });

  return {
    title: document.title,
    generator: document.querySelector('meta[name="generator"]')?.getAttribute('content') ?? null,
    pageHeight: document.documentElement.scrollHeight,
    clientWidth: document.documentElement.clientWidth,
    fonts: [...fonts].sort(),
    sections,
    blocks,
    fragments,
    links,
    media,
  };
}

/**
 * Each text run's contrast against what renders behind it. `png` is a full-page screenshot taken with all
 * text transparent; `runs` are page boxes with the run's colour (sRGB 0–1, alpha times its opacity). Every
 * sampled pixel under a box is a candidate background; the ratio reported is the 5th percentile from the
 * worst, so a stray edge pixel doesn't decide it but a gradient's dark end does. Runs in a blank page.
 */
export async function contrastInPage(input: {
  png: string;
  runs: { box: { x: number; y: number; w: number; h: number }; fg: [number, number, number, number] | null }[];
}): Promise<({ ratio: number; background: string } | null)[]> {
  const img = new Image();
  img.src = input.png;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  const MAX_SAMPLES = 1600;
  return input.runs.map(({ box, fg }) => {
    if (!fg) return null;
    const x0 = Math.max(0, Math.floor(box.x));
    const y0 = Math.max(0, Math.floor(box.y));
    const x1 = Math.min(canvas.width, Math.ceil(box.x + box.w));
    const y1 = Math.min(canvas.height, Math.ceil(box.y + box.h));
    if (x1 - x0 < 1 || y1 - y0 < 1) return null;
    const data = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    const pixels = data.length / 4;
    const stride = Math.max(1, Math.floor(pixels / MAX_SAMPLES));
    const samples: { ratio: number; p: number }[] = [];
    for (let p = 0; p < pixels; p += stride) {
      const [r, g, b] = [data[p * 4] / 255, data[p * 4 + 1] / 255, data[p * 4 + 2] / 255];
      const a = fg[3];
      const over = lum(fg[0] * a + r * (1 - a), fg[1] * a + g * (1 - a), fg[2] * a + b * (1 - a));
      const back = lum(r, g, b);
      samples.push({ ratio: (Math.max(over, back) + 0.05) / (Math.min(over, back) + 0.05), p });
    }
    samples.sort((s, t) => s.ratio - t.ratio);
    const pick = samples[Math.floor(samples.length * 0.05)];
    const o = pick.p * 4;
    return { ratio: pick.ratio, background: `#${hex(data[o])}${hex(data[o + 1])}${hex(data[o + 2])}` };
  });
}
