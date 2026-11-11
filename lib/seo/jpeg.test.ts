import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jpegDimensions } from './jpeg';

/** A JPEG marker segment: FF, marker, big-endian length (payload + 2), payload. */
function segment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...payload];
}

/** An SOF segment: precision, height, width, one component. */
function sof(marker: number, width: number, height: number): number[] {
  return segment(marker, [8, height >> 8, height & 0xff, width >> 8, width & 0xff, 1]);
}

const SOI = [0xff, 0xd8];

describe('jpegDimensions', () => {
  it('reads the committed share cards at 1200×630', () => {
    for (const slug of ['acacia', 'mosurban']) {
      const jpeg = readFileSync(
        fileURLToPath(new URL(`../../docs/review/share-cards-2026-11-11/${slug}.jpg`, import.meta.url))
      );
      expect(jpegDimensions(jpeg)).toEqual({ width: 1200, height: 630 });
    }
  });

  it('reads width and height from a baseline SOF0 after other segments', () => {
    const bytes = Buffer.from([...SOI, ...segment(0xe0, [0, 0, 0, 0, 0]), ...sof(0xc0, 321, 123)]);
    expect(jpegDimensions(bytes)).toEqual({ width: 321, height: 123 });
  });

  it('recognises a progressive SOF2', () => {
    const bytes = Buffer.from([...SOI, ...sof(0xc2, 40, 30)]);
    expect(jpegDimensions(bytes)).toEqual({ width: 40, height: 30 });
  });

  it('skips DHT, which sits in the SOF marker range but is not an SOF', () => {
    const bytes = Buffer.from([...SOI, ...segment(0xc4, [0, 0, 0, 0, 0]), ...sof(0xc0, 50, 60)]);
    expect(jpegDimensions(bytes)).toEqual({ width: 50, height: 60 });
  });

  it('steps over 0xFF fill bytes before a marker', () => {
    const bytes = Buffer.from([...SOI, 0xff, 0xff, ...sof(0xc0, 70, 80)]);
    expect(jpegDimensions(bytes)).toEqual({ width: 70, height: 80 });
  });

  it('throws on bytes that are not a JPEG', () => {
    expect(() => jpegDimensions(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toThrow(
      /not a JPEG/
    );
  });

  it('throws when a marker byte is missing', () => {
    expect(() => jpegDimensions(Buffer.from([...SOI, ...Buffer.alloc(10)]))).toThrow(/bad marker/);
  });

  it('throws when no SOF segment appears', () => {
    const bytes = Buffer.from([...SOI, ...segment(0xe0, [0, 0, 0, 0, 0, 0, 0, 0])]);
    expect(() => jpegDimensions(bytes)).toThrow(/no SOF marker/);
  });
});
