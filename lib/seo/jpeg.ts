/** The share image's byte budget (#66): crawlers fetch it on every share, so it stays small. */
export const SHARE_IMAGE_MAX_BYTES = 300_000;

/** Pixel size from a baseline JPEG's first SOF marker (no image library needed). */
export function jpegDimensions(bytes: Buffer): { width: number; height: number } {
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error('not a JPEG');
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`bad marker at ${offset}`);
    // Encoders may pad with 0xFF fill bytes before a marker.
    while (bytes[offset + 1] === 0xff) offset += 1;
    const marker = bytes[offset + 1];
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  throw new Error('no SOF marker');
}
