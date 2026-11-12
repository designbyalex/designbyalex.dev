/**
 * Case-study share card (#111): the owner's "Green duotone, giant title" pick,
 * rendered at build time from a project's Tina content. `sharp` pre-composes
 * the duotone ground (Satori has no blend modes), `ImageResponse` draws the
 * type over it, and the PNG comes back out as a 1200×630 JPEG.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import React from 'react';
import sharp from 'sharp';
import { measureLineWidth, parseFontMetrics } from './font-metrics';

export interface ShareCardInput {
  title: string;
  tagline?: string | null;
  /** URL path segment, e.g. "acacia" — drawn as designbyalex.dev/{slug}. */
  slug: string;
  /** Hero image as Tina returns it: a site path ("/uploads/…") or a TinaCloud media URL; see publicMediaPath. */
  coverImage?: string | null;
  /** How far the card zooms into the cover image (1 = whole image). */
  shareZoom?: number | null;
}

export const SHARE_CARD_WIDTH = 1200;
export const SHARE_CARD_HEIGHT = 630;
const DEFAULT_SHARE_ZOOM = 1.15;
// The Tina field's 1–2.5 range (ui.validate in tina/collection/project.ts) only runs in the
// editor; hand-edited frontmatter reaches this module unchecked, and a zoom under 1 would
// hand sharp's extract() a negative offset and fail the build.
const SHARE_ZOOM_MIN = 1;
const SHARE_ZOOM_MAX = 2.5;

// Duotone ground: greyscaled hero, multiplied over the home hero gradient.
// Contrast/brightness offset the multiply's darkening (tuned against the
// picker frame — these two constants are the only intended knobs).
const HERO_CONTRAST = 1.1;
const HERO_CONTRAST_OFFSET = -12.8;
const HERO_BRIGHTNESS = 1.15;
const GRADIENT_PATH = 'public/uploads/home/hero-gradient.png';

/** Tina's media root under public/ (tina/config.tsx → media.tina.mediaRoot). */
const MEDIA_ROOT = 'uploads';

/**
 * A cover image's committed file, relative to the repo root. Tina returns
 * either a site path ("/uploads/projects/acacia/hero.png", local datalayer)
 * or a TinaCloud media URL ("https://assets.tina.io/<id>/__staging/<branch>/
 * __file/projects/acacia/hero.png", or "https://assets.tina.io/<id>/projects/
 * acacia/hero.png" on the main branch); both name the same file under
 * public/uploads, which the build reads instead of fetching.
 */
export function publicMediaPath(src: string): string {
  if (!/^https?:\/\//i.test(src)) return path.posix.join('public', src);
  const pathname = decodeURIComponent(new URL(src).pathname);
  const fileMarker = '/__file/';
  const marker = pathname.indexOf(fileMarker);
  const rest =
    marker >= 0
      ? pathname.slice(marker + fileMarker.length)
      : pathname.split('/').filter(Boolean).slice(1).join('/'); // drop the client id
  const relative = rest.startsWith(`${MEDIA_ROOT}/`) ? rest : `${MEDIA_ROOT}/${rest}`;
  return path.posix.join('public', relative);
}

// Title fitting: one line at up to 144px, shrunk to fit 1128px, wrapping to
// two bottom-anchored lines at 96px when even that is too wide.
const TITLE_MAX_SIZE = 144;
const TITLE_MIN_SIZE = 96;
const TITLE_MAX_WIDTH = 1128;
const TITLE_TRACKING_EM = -0.045;

// The brand mark — keep in sync with `MarkGlyph` in components/icon.tsx
// (not imported: that module is 'use client' and pulls lucide-react along).
const MARK_VIEWBOX = '0 0 35 33.2';
const MARK_PATH =
  'M 15.132 16.922 L 1.322 2.39 C 0.836 1.876 0 2.242 0 2.967 L 0 32.034 C 0 32.758 0.835 33.124 1.323 32.612 L 15.132 18.078 C 15.433 17.752 15.433 17.248 15.132 16.922 Z M 19.869 18.078 L 33.677 32.612 C 34.165 33.125 35 32.758 35 32.034 L 35 2.967 C 35 2.242 34.165 1.876 33.677 2.388 L 19.87 16.922 C 19.569 17.248 19.569 17.752 19.87 18.078 Z M 18.21 15.92 L 32.025 1.393 C 32.51 0.879 32.163 0 31.474 0 L 3.848 0 C 3.16 0 2.812 0.88 3.3 1.392 L 17.112 15.92 C 17.254 16.072 17.453 16.158 17.661 16.158 C 17.87 16.158 18.069 16.072 18.211 15.92 Z';

const h = React.createElement;

const fontsDir = () => path.join(process.cwd(), 'lib', 'seo', 'fonts');

/** The committed faces `next/og` can read (ADR 0003's Inter, as TTF/WOFF). */
let fontsPromise: Promise<{ interDisplay: Buffer; inter: Buffer }> | undefined;
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(fontsDir(), 'InterDisplay-Regular.ttf')),
    readFile(path.join(fontsDir(), 'Inter-Regular.woff')),
  ]).then(([interDisplay, inter]) => ({ interDisplay, inter }));
  return fontsPromise;
}

/**
 * The duotone ground as one 1200×630 PNG: the home card's gradient under the
 * project's hero, zoomed, greyscaled and multiplied into a green-tinted
 * monochrome. Without a cover image the gradient stands alone.
 */
async function composeGround(coverImage: string | null | undefined, shareZoom: number): Promise<Buffer> {
  const gradient = sharp(path.join(process.cwd(), GRADIENT_PATH)).resize(SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT, {
    fit: 'cover',
  });
  if (!coverImage) return gradient.png().toBuffer();

  const zoomedWidth = Math.round(SHARE_CARD_WIDTH * shareZoom);
  const zoomedHeight = Math.round(SHARE_CARD_HEIGHT * shareZoom);
  // Two passes so the order is explicit: crop + greyscale + contrast first,
  // then the brightness lift that offsets the multiply.
  const heroMono = await sharp(path.join(process.cwd(), publicMediaPath(coverImage)))
    .resize(zoomedWidth, zoomedHeight, { fit: 'cover', position: 'centre' })
    .extract({
      left: Math.floor((zoomedWidth - SHARE_CARD_WIDTH) / 2),
      top: Math.floor((zoomedHeight - SHARE_CARD_HEIGHT) / 2),
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
    })
    .greyscale()
    .linear(HERO_CONTRAST, HERO_CONTRAST_OFFSET)
    .toBuffer();
  const hero = await sharp(heroMono).modulate({ brightness: HERO_BRIGHTNESS }).toBuffer();

  return gradient
    .composite([{ input: hero, blend: 'multiply' }])
    .png()
    .toBuffer();
}

/** Pick the title's size and whether it wraps, per the never-crop rule. */
function fitTitle(title: string, interDisplay: Buffer): { fontSize: number; wrap: boolean } {
  const metrics = parseFontMetrics(interDisplay);
  const widthAtMax = measureLineWidth(metrics, title, TITLE_MAX_SIZE, TITLE_TRACKING_EM);
  if (widthAtMax <= TITLE_MAX_WIDTH) return { fontSize: TITLE_MAX_SIZE, wrap: false };
  const fitted = Math.floor((TITLE_MAX_SIZE * TITLE_MAX_WIDTH) / widthAtMax);
  if (fitted >= TITLE_MIN_SIZE) return { fontSize: fitted, wrap: false };
  return { fontSize: TITLE_MIN_SIZE, wrap: true };
}

/** Render one project's share card as a 1200×630 JPEG. */
export async function renderShareCard({ title, tagline, slug, coverImage, shareZoom }: ShareCardInput): Promise<Buffer> {
  const [{ interDisplay, inter }, ground] = await Promise.all([
    loadFonts(),
    composeGround(coverImage, Math.min(SHARE_ZOOM_MAX, Math.max(SHARE_ZOOM_MIN, shareZoom ?? DEFAULT_SHARE_ZOOM))),
  ]);
  const titleFit = fitTitle(title, interDisplay);

  const card = h(
    'div',
    {
      style: {
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        display: 'flex',
        position: 'relative',
        backgroundColor: '#04120b',
      },
    },
    // 1. Duotone ground (pre-composed — Satori has no blend modes).
    h('img', {
      src: `data:image/png;base64,${ground.toString('base64')}`,
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      style: { position: 'absolute', top: 0, left: 0 },
    }),
    // 2. Wash: darker behind the tagline and title, green showing mid-card.
    h('div', {
      style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(4,18,11,0.3)' },
    }),
    h('div', {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage:
          'linear-gradient(180deg, rgba(4,18,11,0.55) 0%, rgba(4,18,11,0.25) 38%, rgba(4,18,11,0.35) 60%, rgba(4,18,11,0.8) 100%)',
      },
    }),
    // 3. Tagline.
    tagline
      ? h(
          'div',
          {
            style: {
              position: 'absolute',
              top: 41,
              left: 40,
              maxWidth: 624,
              fontFamily: 'Inter',
              fontSize: 30,
              lineHeight: 1.3,
              color: '#ffffff',
              textShadow: '0 1px 10px rgba(0,0,0,0.35)',
            },
          },
          tagline
        )
      : null,
    // 4. Mark.
    h(
      'svg',
      {
        viewBox: MARK_VIEWBOX,
        width: 42,
        height: 40,
        style: { position: 'absolute', top: 41, right: 40 },
      },
      h('path', { d: MARK_PATH, fill: '#ffffff' })
    ),
    // 5. Title.
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 36,
          bottom: 50,
          // An explicit width, not maxWidth: Satori measures text against width
          // only, and an unconstrained measure breaks the bottom anchoring.
          ...(titleFit.wrap ? { width: TITLE_MAX_WIDTH, whiteSpace: 'normal' } : { whiteSpace: 'nowrap' }),
          fontFamily: 'Inter Display',
          fontSize: titleFit.fontSize,
          lineHeight: 1,
          letterSpacing: TITLE_TRACKING_EM * titleFit.fontSize,
          color: '#ffffff',
        },
      },
      title
    ),
    // 6. URL.
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 40,
          bottom: 24,
          fontFamily: 'Inter',
          fontSize: 16,
          color: 'rgba(255,255,255,0.85)',
        },
      },
      `designbyalex.dev/${slug}`
    )
  );

  const png = new ImageResponse(card, {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    fonts: [
      { name: 'Inter', data: inter, weight: 400, style: 'normal' },
      { name: 'Inter Display', data: interDisplay, weight: 400, style: 'normal' },
    ],
  });

  return sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
