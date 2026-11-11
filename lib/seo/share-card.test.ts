import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { jpegDimensions, SHARE_IMAGE_MAX_BYTES } from './jpeg';
import { renderShareCard, type ShareCardInput } from './share-card';

// Satori + sharp render a full card per test; give them room on a cold run.
const RENDER_TIMEOUT_MS = 60_000;

/**
 * A project's share-card inputs straight from its committed frontmatter, so
 * the budget below is checked against what the build will actually render.
 * (Line-based on purpose: every field the card reads is a single `key: value`
 * line in these documents.)
 */
function projectInput(slug: string): ShareCardInput {
  const mdx = readFileSync(
    fileURLToPath(new URL(`../../content/projects/${slug}.mdx`, import.meta.url)),
    'utf8'
  );
  const field = (name: string) => mdx.match(new RegExp(`^${name}: (.+)$`, 'm'))?.[1];
  const title = field('title');
  if (!title) throw new Error(`content/projects/${slug}.mdx has no title`);
  const shareZoom = field('shareZoom');
  return {
    title,
    tagline: field('tagline') ?? null,
    slug,
    coverImage: field('coverImage') ?? null,
    shareZoom: shareZoom ? Number(shareZoom) : null,
  };
}

/** Optional dump for eyeballing/attaching the cards: OG_PREVIEW_DIR=.afk/og pnpm test */
function dump(slug: string, jpeg: Buffer) {
  const dir = process.env.OG_PREVIEW_DIR;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${slug}.jpg`), jpeg);
}

describe('renderShareCard', () => {
  for (const slug of ['acacia', 'mosurban']) {
    it(
      `renders the ${slug} card as a 1200×630 JPEG under the share budget`,
      async () => {
        const input = projectInput(slug);
        expect(input.coverImage).toMatch(/^\/uploads\//);
        const jpeg = await renderShareCard(input);
        dump(slug, jpeg);
        expect(jpegDimensions(jpeg)).toEqual({ width: 1200, height: 630 });
        expect(jpeg.length).toBeLessThanOrEqual(SHARE_IMAGE_MAX_BYTES);
      },
      RENDER_TIMEOUT_MS
    );
  }

  it(
    'still renders when a long title has to shrink and wrap',
    async () => {
      const jpeg = await renderShareCard({
        ...projectInput('acacia'),
        title: 'A Deliberately Long Case-Study Title Here', // 42 chars — past the two-line threshold
        slug: 'long',
      });
      dump('long-title', jpeg);
      expect(jpegDimensions(jpeg)).toEqual({ width: 1200, height: 630 });
    },
    RENDER_TIMEOUT_MS
  );
});
