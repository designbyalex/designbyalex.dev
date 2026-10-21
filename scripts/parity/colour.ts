// Computed colours as Chrome serialises them: legacy colours as rgb()/rgba(), modern ones (Tailwind 4's
// tokens) as oklch()/oklab()/color(). The comparator measures their distance in OKLab, so `oklch(…)` and
// `rgb(…)` for the same grey compare equal.

export interface OkLab {
  L: number;
  a: number;
  b: number;
  alpha: number;
}

const num = (s: string, percentOf = 1): number => (s.endsWith('%') ? (Number.parseFloat(s) / 100) * percentOf : Number.parseFloat(s));

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function srgbToOklab(r: number, g: number, b: number, alpha: number): OkLab {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    alpha,
  };
}

function oklabToSrgb({ L, a, b }: OkLab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, fromLinear(c)))) as [number, number, number];
}

/** Parses a computed colour, or returns null for a syntax it doesn't know. */
export function parseColour(input: string): OkLab | null {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return { L: 0, a: 0, b: 0, alpha: 0 };
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const h = hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    const [r, g, b, a = 255] = h.match(/../g)!.map((p) => Number.parseInt(p, 16));
    return srgbToOklab(r / 255, g / 255, b / 255, a / 255);
  }
  const fn = s.match(/^([a-z]+)\((.*)\)$/);
  if (!fn) return null;
  const [body, alphaPart] = fn[2].split('/');
  const parts = body.replace(/,/g, ' ').trim().split(/\s+/);
  const alphaToken = alphaPart?.trim() ?? (fn[1] === 'rgba' || (fn[1] === 'rgb' && parts.length === 4) ? parts.pop() : undefined);
  const alpha = alphaToken === undefined ? 1 : num(alphaToken);
  switch (fn[1]) {
    case 'rgb':
    case 'rgba': {
      const [r, g, b] = parts.map((p) => num(p, 255) / 255);
      return srgbToOklab(r, g, b, alpha);
    }
    case 'oklab': {
      const [L, a, b] = [num(parts[0]), num(parts[1], 0.4), num(parts[2], 0.4)];
      return { L, a, b, alpha };
    }
    case 'oklch': {
      const [L, C, H] = [num(parts[0]), num(parts[1], 0.4), Number.parseFloat(parts[2])];
      const h = ((Number.isNaN(H) ? 0 : H) * Math.PI) / 180;
      return { L, a: C * Math.cos(h), b: C * Math.sin(h), alpha };
    }
    case 'color': {
      if (parts[0] !== 'srgb') return null;
      const [r, g, b] = parts.slice(1).map((p) => num(p));
      return srgbToOklab(r, g, b, alpha);
    }
    default:
      return null;
  }
}

/** Distance in OKLab × 100, alpha included. */
export function colourDistance(a: OkLab, b: OkLab): number {
  return 100 * Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b, a.alpha - b.alpha);
}

/** `#a6a6a6`, or `#a6a6a680` when translucent; unknown syntaxes are returned as given. */
export function formatColour(input: string): string {
  const c = parseColour(input);
  if (!c) return input;
  const hex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  const rgb = oklabToSrgb(c).map(hex).join('');
  return `#${rgb}${c.alpha < 1 ? hex(c.alpha) : ''}`;
}

/** sRGB channels and alpha, each 0–1, or null for a syntax it doesn't know. */
export function toSrgb(input: string): [number, number, number, number] | null {
  const c = parseColour(input);
  return c ? [...oklabToSrgb(c), c.alpha] : null;
}
