// Checks on the committed gate inputs: the frozen Reference snapshot, the gate config and the Deviation list.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compare } from './compare.ts';
import { parseDeviations, parseGateConfig } from './config.ts';
import { parseManifest, parsePageSnapshot } from './validate.ts';

const read = (path: string): unknown => JSON.parse(readFileSync(new URL(`../../parity/${path}`, import.meta.url), 'utf8'));
const manifest = parseManifest(read('reference/manifest.json'));
const config = parseGateConfig(read('gate-config.json'));
const deviations = parseDeviations(read('deviations.json'));

describe('the committed Reference snapshot', () => {
  it('has twelve page × width snapshots that parse against the snapshot types', () => {
    expect(manifest.captures).toHaveLength(12);
    for (const c of manifest.captures) {
      const snap = parsePageSnapshot(read(`reference/${c.snapshot}`));
      expect([snap.path, snap.width, snap.status, snap.sections.map((s) => s.id)]).toEqual([c.path, c.width, c.status, c.sections]);
    }
  });

  it('rejects a snapshot whose fields have the wrong shape', () => {
    const snap = read('reference/home-1440.json') as { runs: { style: { size: unknown } }[] };
    snap.runs[3].style.size = '18px';
    expect(() => parsePageSnapshot(snap)).toThrow('runs[3].style.size: expected a number');
  });

  it('matches itself: every run pairs, and the only Gaps are its Framer-hosted media', () => {
    const identity = { ...config, sectionMap: Object.fromEntries(Object.keys(config.sectionMap).map((k) => [k, k])) };
    for (const c of manifest.captures) {
      const snap = parsePageSnapshot(read(`reference/${c.snapshot}`));
      const r = compare({ page: c.page, reference: snap, build: snap, config: identity, deviations: [] });
      expect(r.matched.runs).toBe(r.matched.of);
      expect(r.gaps.filter((g) => g.check !== 'media-host')).toEqual([]);
      expect(r.gaps.length).toBe(snap.media.filter((m) => m.host === 'framerusercontent.com').length);
    }
  });
});

describe('the gate config', () => {
  it('maps every Reference Section to a Build Section', () => {
    const referenceSections = new Set(manifest.captures.flatMap((c) => c.sections));
    referenceSections.add('(none)'); // the Reference 404's text sits in no Section
    expect([...referenceSections].filter((s) => !(s in config.sectionMap))).toEqual([]);
  });

  it('maps no two Reference Sections to one Build Section', () => {
    const builds = Object.values(config.sectionMap);
    expect(builds.filter((b, i) => builds.indexOf(b) !== i)).toEqual([]);
  });
});

describe('the Deviation list', () => {
  it('holds the seven Deviations approved in #46, then the owner-approved additions', () => {
    expect(deviations.map((d) => d.id)).toEqual([
      'themed-404',
      'per-page-metadata',
      'the-their-typo',
      'reduced-motion',
      'header-theme-toggle',
      'en-dash-date-ranges',
      'dynamic-footer-year',
      // Approved by the owner during the AFK run (#59): a Reference capture artefact at 1440.
      'cv-link-capture-1440',
      // Approved by the owner during the AFK run (#61): Framer's fifth key feature never fades in.
      'solution-fifth-key-feature',
      // Approved by the owner during the AFK run (#65): staggered fade-ins the capture missed.
      'mos-last-list-item-clients',
      'mos-last-list-item-ux',
      'mos-last-list-item-brand',
      'mos-last-list-item-outcome',
      // Approved by the owner during the AFK run (#54): curly quotes throughout, per story 29.
      'curly-quotes',
    ]);
  });

  it('anchors the typo and date-range entries on text the Reference actually has', () => {
    const texts = new Set(manifest.captures.flatMap((c) => parsePageSnapshot(read(`reference/${c.snapshot}`)).runs.map((r) => r.text)));
    const anchored = deviations.filter((d) => ['the-their-typo', 'en-dash-date-ranges', 'dynamic-footer-year', 'header-theme-toggle'].includes(d.id));
    const anchors = anchored.flatMap((d) => (Array.isArray(d.anchor) ? d.anchor : [d.anchor]));
    expect(anchors.filter((a) => !texts.has(a))).toEqual([]);
  });

  it('rejects an entry with an unknown check or a missing decision', () => {
    const entry = { id: 'x', page: '*', section: '*', check: 'colour', anchor: '*', decision: 'because' };
    expect(() => parseDeviations({ deviations: [entry] })).toThrow('deviations[0].check: unknown check "colour"');
    expect(() => parseDeviations({ deviations: [{ ...entry, check: 'color', decision: '' }] })).toThrow('deviations[0].decision: expected a non-empty string');
  });
});
