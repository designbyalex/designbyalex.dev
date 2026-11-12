/**
 * Minimal TrueType reader: just enough to measure a one-line string's advance
 * width, so the share card can decide whether a title fits before Satori lays
 * it out (Satori exposes no measurement API). Reads `head` (units per em),
 * `hhea`/`hmtx` (advance widths) and `cmap` (char → glyph, formats 4 and 12).
 * Kerning is ignored, which only ever over-estimates width — safe for a
 * "never crop" rule.
 */

export interface FontMetrics {
  unitsPerEm: number;
  /** Advance width of the glyph for a code point, in font units. */
  advanceOf(codePoint: number): number;
}

function tableOffsets(buf: Buffer): Map<string, number> {
  const numTables = buf.readUInt16BE(4);
  const tables = new Map<string, number>();
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    tables.set(buf.toString('latin1', rec, rec + 4), buf.readUInt32BE(rec + 8));
  }
  return tables;
}

/** char → glyph id from a format-4 cmap subtable (Basic Multilingual Plane). */
function glyphFromFormat4(buf: Buffer, at: number, code: number): number {
  const segCount = buf.readUInt16BE(at + 6) / 2;
  const endCodes = at + 14;
  const startCodes = endCodes + segCount * 2 + 2; // +2 skips reservedPad
  const idDeltas = startCodes + segCount * 2;
  const idRangeOffsets = idDeltas + segCount * 2;
  for (let seg = 0; seg < segCount; seg++) {
    if (code > buf.readUInt16BE(endCodes + seg * 2)) continue;
    const start = buf.readUInt16BE(startCodes + seg * 2);
    if (code < start) return 0;
    const rangeOffset = buf.readUInt16BE(idRangeOffsets + seg * 2);
    const delta = buf.readInt16BE(idDeltas + seg * 2);
    if (rangeOffset === 0) return (code + delta) & 0xffff;
    const glyphAt = idRangeOffsets + seg * 2 + rangeOffset + (code - start) * 2;
    const glyph = buf.readUInt16BE(glyphAt);
    return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
  }
  return 0;
}

/** char → glyph id from a format-12 cmap subtable (full Unicode). */
function glyphFromFormat12(buf: Buffer, at: number, code: number): number {
  const nGroups = buf.readUInt32BE(at + 12);
  for (let g = 0; g < nGroups; g++) {
    const group = at + 16 + g * 12;
    if (code < buf.readUInt32BE(group)) return 0;
    if (code <= buf.readUInt32BE(group + 4)) {
      return buf.readUInt32BE(group + 8) + (code - buf.readUInt32BE(group));
    }
  }
  return 0;
}

export function parseFontMetrics(font: Buffer): FontMetrics {
  const tables = tableOffsets(font);
  const head = tables.get('head');
  const hhea = tables.get('hhea');
  const hmtx = tables.get('hmtx');
  const cmap = tables.get('cmap');
  if (head === undefined || hhea === undefined || hmtx === undefined || cmap === undefined) {
    throw new Error('font is missing a required table (head/hhea/hmtx/cmap)');
  }

  const unitsPerEm = font.readUInt16BE(head + 18);
  const numberOfHMetrics = font.readUInt16BE(hhea + 34);

  // Prefer a full-Unicode (format 12) subtable, else the BMP format-4 one.
  let format4At: number | undefined;
  let format12At: number | undefined;
  const subtableCount = font.readUInt16BE(cmap + 2);
  for (let i = 0; i < subtableCount; i++) {
    const rec = cmap + 4 + i * 8;
    const at = cmap + font.readUInt32BE(rec + 4);
    const format = font.readUInt16BE(at);
    if (format === 12 && format12At === undefined) format12At = at;
    if (format === 4 && format4At === undefined) format4At = at;
  }
  if (format4At === undefined && format12At === undefined) {
    throw new Error('font has no format-4 or format-12 cmap subtable');
  }

  return {
    unitsPerEm,
    advanceOf(codePoint: number): number {
      const glyph =
        format12At !== undefined
          ? glyphFromFormat12(font, format12At, codePoint)
          : glyphFromFormat4(font, format4At as number, codePoint);
      const metric = Math.min(glyph, numberOfHMetrics - 1);
      return font.readUInt16BE(hmtx + metric * 4);
    },
  };
}

/** Width in px of `text` on one line at `fontSize`, with CSS-style letter spacing. */
export function measureLineWidth(
  metrics: FontMetrics,
  text: string,
  fontSize: number,
  letterSpacingEm: number
): number {
  const codePoints = [...text];
  let units = 0;
  for (const cp of codePoints) units += metrics.advanceOf(cp.codePointAt(0) as number);
  const advance = (units / metrics.unitsPerEm) * fontSize;
  // Spacing between glyphs only: with negative tracking this over-counts by one
  // gap versus CSS (which also tracks the final glyph), erring towards "fits".
  return advance + Math.max(0, codePoints.length - 1) * letterSpacingEm * fontSize;
}
