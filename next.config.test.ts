import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

/** URLs the Framer site serves today; they must keep working at the same path after the cutover (#15). */
const FRAMER_PATHS = ['/', '/acacia', '/mosurban'];

async function loadRedirects() {
  if (!nextConfig.redirects) throw new Error('next.config.ts has no redirects()');
  return nextConfig.redirects();
}

describe('redirects', () => {
  it('sends /home to the homepage permanently (308)', async () => {
    const redirects = await loadRedirects();
    expect(redirects).toContainEqual({ source: '/home', destination: '/', permanent: true });
  });

  it('uses literal paths only, so the checks below cover every match', async () => {
    for (const { source } of await loadRedirects()) {
      expect(source).toMatch(/^\/[a-z0-9/-]*$/);
    }
  });

  it('never redirects a URL the Framer site serves', async () => {
    const sources = (await loadRedirects()).map((r) => r.source);
    for (const path of FRAMER_PATHS) {
      expect(sources).not.toContain(path);
    }
  });

  it('makes every redirect permanent', async () => {
    for (const r of await loadRedirects()) {
      expect(r).toMatchObject({ permanent: true });
    }
  });
});
