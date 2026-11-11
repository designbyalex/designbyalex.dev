import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { measureLineWidth, parseFontMetrics } from './font-metrics';

/** Big-endian u16 sequence; negative values wrap (for idDelta). */
function u16(...values: number[]): Buffer {
  const buf = Buffer.alloc(values.length * 2);
  values.forEach((v, i) => buf.writeUInt16BE(v & 0xffff, i * 2));
  return buf;
}

/**
 * A hand-built sfnt with known numbers: unitsPerEm 1000, three glyphs with
 * advances 500 (.notdef) / 600 / 700, and a format-4 cmap mapping
 * A→glyph 1, B→glyph 2.
 */
function syntheticFont(): Buffer {
  const head = Buffer.alloc(20);
  head.writeUInt16BE(1000, 18); // unitsPerEm
  const hhea = Buffer.alloc(36);
  hhea.writeUInt16BE(3, 34); // numberOfHMetrics
  const hmtx = u16(500, 0, 600, 0, 700, 0); // (advance, lsb) per glyph
  const subtable = u16(
    4, 32, 0, // format, length, language
    4, 4, 1, 0, // segCountX2, searchRange, entrySelector, rangeShift
    66, 0xffff, // endCodes: A–B segment, terminator
    0, // reservedPad
    65, 0xffff, // startCodes
    -64, 1, // idDeltas: 65 − 64 = glyph 1
    0, 0 // idRangeOffsets
  );
  const cmap = Buffer.concat([
    u16(0, 1, 3, 1), // version, numTables, platformID, encodingID
    Buffer.from([0, 0, 0, 12]), // subtable offset from cmap start
    subtable,
  ]);

  const tables: Array<[string, Buffer]> = [
    ['head', head],
    ['hhea', hhea],
    ['hmtx', hmtx],
    ['cmap', cmap],
  ];
  const records: Buffer[] = [];
  let offset = 12 + tables.length * 16;
  for (const [tag, data] of tables) {
    const rec = Buffer.alloc(16);
    rec.write(tag, 0, 'latin1');
    rec.writeUInt32BE(offset, 8);
    rec.writeUInt32BE(data.length, 12);
    records.push(rec);
    offset += data.length;
  }
  const sfnt = Buffer.alloc(12);
  sfnt.writeUInt32BE(0x00010000, 0);
  sfnt.writeUInt16BE(tables.length, 4);
  return Buffer.concat([sfnt, ...records, ...tables.map(([, data]) => data)]);
}

describe('parseFontMetrics', () => {
  const metrics = parseFontMetrics(syntheticFont());

  it('reads unitsPerEm from head', () => {
    expect(metrics.unitsPerEm).toBe(1000);
  });

  it('maps characters through a format-4 cmap to their advances', () => {
    expect(metrics.advanceOf(65)).toBe(600); // A → glyph 1
    expect(metrics.advanceOf(66)).toBe(700); // B → glyph 2
  });

  it('falls back to .notdef for an unmapped character', () => {
    expect(metrics.advanceOf(122)).toBe(500); // z is outside the A–B segment
  });

  it('throws on a buffer without the required tables', () => {
    expect(() => parseFontMetrics(Buffer.alloc(12))).toThrow(/missing a required table/);
  });

  it('parses the committed Inter Display face with sane proportions', () => {
    const inter = parseFontMetrics(
      readFileSync(fileURLToPath(new URL('./fonts/InterDisplay-Regular.ttf', import.meta.url)))
    );
    expect(inter.unitsPerEm).toBeGreaterThan(0);
    expect(inter.advanceOf('M'.codePointAt(0) as number)).toBeGreaterThan(
      inter.advanceOf('i'.codePointAt(0) as number)
    );
  });
});

describe('measureLineWidth', () => {
  const metrics = parseFontMetrics(syntheticFont());

  it('measures an empty string as zero', () => {
    expect(measureLineWidth(metrics, '', 144, 0)).toBe(0);
  });

  it('sums advances scaled to the font size', () => {
    // (600 + 700) / 1000 × 10
    expect(measureLineWidth(metrics, 'AB', 10, 0)).toBe(13);
  });

  it('adds letter spacing between glyphs only', () => {
    expect(measureLineWidth(metrics, 'AB', 10, 0.1)).toBe(14); // one gap
    expect(measureLineWidth(metrics, 'A', 10, 0.1)).toBe(6); // no gap
  });

  it('scales linearly with font size', () => {
    expect(measureLineWidth(metrics, 'AB', 20, 0)).toBe(2 * measureLineWidth(metrics, 'AB', 10, 0));
  });
});
