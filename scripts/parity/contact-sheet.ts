// Side-by-side images for review: the Reference on the left, the Build on the right, each labelled.
// The gate writes one per page and width (whole page) and one per Section and width (cropped).
// Composed on a canvas in the browser the gate already runs, so the harness needs no image library.
import type { Browser } from 'playwright';

export interface SheetSide {
  jpeg: Buffer;
  label: string;
  /** Region of the image to show, in image px; the whole image when left out. */
  crop?: { x: number; y: number; w: number; h: number };
}

const LABEL_PX = 28;
const GUTTER_PX = 16;
// Chrome refuses canvases past 32,767px a side; taller sheets are scaled down to fit.
const MAX_SIDE_PX = 30_000;

export async function sideBySide(browser: Browser, left: SheetSide, right: SheetSide, quality = 0.7): Promise<Buffer> {
  const page = await browser.newPage();
  try {
    const dataUrl = await page.evaluate(
      async ({ sides, quality, LABEL_PX, GUTTER_PX, MAX_SIDE_PX }) => {
        const loaded = await Promise.all(
          sides.map(async (s) => {
            const img = new Image();
            img.src = s.src;
            await img.decode();
            const crop = s.crop ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
            // Clamp to the image: a Section box can run past a screenshot that was cut short.
            const x = Math.max(0, Math.min(crop.x, img.naturalWidth - 1));
            const y = Math.max(0, Math.min(crop.y, img.naturalHeight - 1));
            const w = Math.max(1, Math.min(crop.w, img.naturalWidth - x));
            const h = Math.max(1, Math.min(crop.h, img.naturalHeight - y));
            return { img, label: s.label, x, y, w, h };
          })
        );
        const col = Math.max(...loaded.map((s) => s.w));
        const rawW = col * 2 + GUTTER_PX;
        const rawH = LABEL_PX + Math.max(...loaded.map((s) => s.h));
        const scale = Math.min(1, MAX_SIDE_PX / rawW, MAX_SIDE_PX / rawH);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(rawW * scale);
        canvas.height = Math.round(rawH * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.scale(scale, scale);
        ctx.fillStyle = '#202020';
        ctx.fillRect(0, 0, rawW, rawH);
        ctx.imageSmoothingQuality = 'high';
        loaded.forEach((s, i) => {
          const left = i * (col + GUTTER_PX);
          ctx.fillStyle = '#f5f5f5';
          ctx.font = '600 15px -apple-system, system-ui, sans-serif';
          ctx.fillText(s.label, left + 8, 19);
          ctx.drawImage(s.img, s.x, s.y, s.w, s.h, left, LABEL_PX, s.w, s.h);
        });
        return canvas.toDataURL('image/jpeg', quality);
      },
      {
        sides: [left, right].map((s) => ({ src: `data:image/jpeg;base64,${s.jpeg.toString('base64')}`, label: s.label, crop: s.crop })),
        quality,
        LABEL_PX,
        GUTTER_PX,
        MAX_SIDE_PX,
      }
    );
    return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  } finally {
    await page.close();
  }
}
