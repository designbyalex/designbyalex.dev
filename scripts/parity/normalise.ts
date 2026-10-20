// Text normalisation for the Parity comparator. Snapshot text is the DOM text before text-transform, with
// quotes, dashes and case verbatim, so the comparator decides here what counts as "the same text".

/** The text a visitor sees: the DOM text with the run's CSS text-transform applied. */
export function rendered(text: string, transform: string): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') return text.replace(/(^|[\s\-–—(“"‘'])(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toUpperCase());
  return text;
}

const QUOTES_SINGLE = /[‘’‚‛′`´]/g;
const QUOTES_DOUBLE = /[“”„‟″«»]/g;
const DASHES = /[‐‑‒–—―−]/g;

/** Case-folded, with curly/straight quotes and every dash unified and whitespace collapsed. */
export function copyKey(text: string): string {
  return text.normalize('NFKC').replace(QUOTES_SINGLE, "'").replace(QUOTES_DOUBLE, '"').replace(DASHES, '-').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Letters and digits only, case-folded: equal keys mean the texts differ at most in punctuation, spacing and case. */
export function letterKey(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

/** Case-folded words (letters and digits), space-separated: for containment and word-overlap scores. */
export function wordKey(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export interface CopyDifference {
  /** Letters and digits differ only in case. */
  case: boolean;
  /** Punctuation differs (quotes, dashes, symbols) beyond quote style alone; whitespace is ignored. */
  punctuation: boolean;
  /** The only punctuation difference is curly versus straight quotes. */
  quoteStyle: boolean;
}

/** How two rendered texts that share a letterKey differ. */
export function copyDifference(expected: string, actual: string): CopyDifference {
  const letters = (s: string) => s.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '');
  const punct = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
  const unquoted = (s: string) => punct(s).replace(QUOTES_SINGLE, "'").replace(QUOTES_DOUBLE, '"');
  const differs = punct(expected) !== punct(actual);
  const onlyQuotes = differs && unquoted(expected) === unquoted(actual);
  return { case: letters(expected) !== letters(actual), punctuation: differs && !onlyQuotes, quoteStyle: onlyQuotes };
}

/** Dice coefficient over the two texts' word multisets, 0..1. */
export function wordOverlap(a: string, b: string): number {
  const wa = wordKey(a).split(' ').filter(Boolean);
  const wb = wordKey(b).split(' ').filter(Boolean);
  if (wa.length === 0 || wb.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const w of wa) counts.set(w, (counts.get(w) ?? 0) + 1);
  let shared = 0;
  for (const w of wb) {
    const n = counts.get(w) ?? 0;
    if (n > 0) {
      shared++;
      counts.set(w, n - 1);
    }
  }
  return (2 * shared) / (wa.length + wb.length);
}

/** True when `short` appears in `long` as whole words. */
export function containsWords(long: string, short: string): boolean {
  const s = wordKey(short);
  return s.length > 0 && ` ${wordKey(long)} `.includes(` ${s} `);
}

/**
 * The family a visitor's browser rendered, from the first entry of the computed stack. next/font renames
 * families to `__Inter_Tight_5f3b2a` (and `__Inter_Tight_Fallback_5f3b2a`); this restores `Inter Tight`.
 */
export function familyName(family: string): string {
  const unquoted = family.replace(/^['"]|['"]$/g, '').trim();
  const nextFont = unquoted.match(/^__(.+?)(?:_Fallback)?_[0-9a-f]{6}$/);
  return nextFont ? nextFont[1].replace(/_/g, ' ') : unquoted;
}
