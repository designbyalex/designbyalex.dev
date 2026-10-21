// The Net-new (light) theme's pre-Cutover bar (pure, #67, CONTEXT.md: Net-new theme). The gate extracts each
// page in dark and in light; this module turns the pair into Gaps of two Dimensions:
//
// - Theme: the Build in light against the Build in dark, with the comparator's own Section-relative checks.
//   Layout and Media differences, and text or links present in one theme only, are Gaps. Type isn't: the
//   colours differ by design.
// - Contrast: every text run in light against its rendered background, sampled in the browser from a
//   screenshot with the text made transparent (collect.ts, contrastInPage), so gradients and images count.
//   A run below WCAG AA (4.5:1, or 3:1 for large text) is a Gap.
//
// Both report under the Reference Section the dark comparison uses, so a Section's Baseline row holds all
// six Dimensions.
import { CHECKS, type Check } from './checks.ts';
import { formatColour } from './colour.ts';
import { type Gap, type SuppressedGap, compare, deviationMatches } from './compare.ts';
import { type Deviation, type GateConfig, NO_SECTION } from './config.ts';
import { rendered } from './normalise.ts';
import type { PageSnapshot, TextStyle } from './snapshot.ts';

export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;

/** WCAG large text: 18pt (24px), or 14pt (18.66px) bold. */
export const isLargeText = (style: Pick<TextStyle, 'size' | 'weight'>) => style.size >= 24 || (style.size >= 18.66 && style.weight >= 700);

/** A text run's worst contrast against the pixels behind it (after discarding stray edge pixels). */
export interface RunContrast {
  ratio: number;
  /** The background pixel behind that ratio, `#rrggbb`. */
  background: string;
}

const luminance = ([r, g, b]: readonly number[]) => {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG contrast of a (possibly translucent) foreground over an opaque background, channels 0–1. */
export function contrastRatio(fg: readonly [number, number, number, number], bg: readonly [number, number, number]): number {
  const a = fg[3];
  const over = [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  const [hi, lo] = [luminance(over), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const ANCHOR_CHARS = 60;
const short = (text: string) => (text.length > ANCHOR_CHARS ? `${text.slice(0, ANCHOR_CHARS - 1)}…` : text);

/** Build Section id → the Reference Section the dark comparison reports it under (its own id when unmapped). */
function reportSection(reference: PageSnapshot, config: GateConfig) {
  const toReference = new Map<string, string>();
  for (const s of reference.sections) {
    const b = config.sectionMap[s.id];
    if (b !== undefined && !toReference.has(b)) toReference.set(b, s.id);
  }
  return (buildSection: string | null) => {
    const id = buildSection ?? NO_SECTION;
    return toReference.get(id) ?? id;
  };
}

const THEME_CHECK: Partial<Record<Check, Check>> = {
  'copy-missing': 'theme-copy',
  'copy-extra': 'theme-copy',
  'link-missing': 'theme-copy',
  'link-extra': 'theme-copy',
  'media-missing': 'theme-media',
  'media-extra': 'theme-media',
  'media-size': 'theme-media',
  'media-position': 'theme-media',
  'media-radius': 'theme-media',
  'media-fit': 'theme-media',
};
const themeCheck = (check: Check): Check | undefined => (CHECKS[check] === 'Layout' ? 'theme-layout' : THEME_CHECK[check]);

export interface ThemeInput {
  /** Reference page key. */
  page: string;
  /** The page's Reference snapshot at this width, for the Section names Gaps report under. */
  reference: PageSnapshot;
  dark: PageSnapshot;
  light: PageSnapshot;
  config: GateConfig;
}

/** The light Build against the dark Build: Theme Gaps, `expected` being the dark value. */
export function compareThemes({ page, reference, dark, light, config }: ThemeInput): Gap[] {
  const identity = Object.fromEntries([...dark.sections.map((s) => [s.id, s.id]), [NO_SECTION, NO_SECTION]]);
  const { gaps } = compare({ page, reference: dark, build: light, config: { ...config, sectionMap: identity }, deviations: [] });
  const section = reportSection(reference, config);
  return gaps.flatMap((g) => {
    const check = themeCheck(g.check);
    if (!check) return [];
    const s = section(g.section);
    // The comparator's message after its `<path> <section> @<width> ` prefix: `"<anchor>": <detail>`.
    const rest = g.message.slice(`${g.path} ${g.section} @${g.width} `.length);
    return [{ ...g, section: s, dimension: CHECKS[check], check, message: `${g.path} ${s} @${g.width} light vs dark ${rest}` }];
  });
}

export interface ContrastInput {
  page: string;
  reference: PageSnapshot;
  light: PageSnapshot;
  config: GateConfig;
  /** Per run of `light`, in order; null where nothing was sampled (off the page, or a colour it can't read). */
  contrast: (RunContrast | null)[];
}

/** Text runs in light below AA: Contrast Gaps. */
export function contrastGaps({ page, reference, light, config, contrast }: ContrastInput): Gap[] {
  const section = reportSection(reference, config);
  const gaps: Gap[] = [];
  light.runs.forEach((run, i) => {
    const c = contrast[i];
    // Visually hidden text (a skip link's 1px clip box) has nothing to read against.
    if (!c || run.box.w < 2 || run.box.h < 2) return;
    const needed = isLargeText(run.style) ? AA_LARGE : AA_NORMAL;
    if (c.ratio >= needed) return;
    const s = section(run.section);
    const anchor = rendered(run.text, run.style.transform);
    const actual = `${c.ratio.toFixed(2)}:1`;
    gaps.push({
      page,
      path: light.path,
      width: light.width,
      section: s,
      dimension: 'Contrast',
      check: 'contrast',
      anchor,
      expected: `${needed}:1`,
      actual,
      message: `${light.path} ${s} @${light.width} light "${short(anchor)}": contrast ${actual} (text ${formatColour(run.style.color)} on ${c.background}), AA needs ${needed}:1`,
    });
  });
  return gaps;
}

/** Splits Gaps into open and suppressed by the Deviation list, as the comparator does. */
export function applyDeviations(gaps: Gap[], deviations: Deviation[]): { open: Gap[]; suppressed: SuppressedGap[] } {
  const open: Gap[] = [];
  const suppressed: SuppressedGap[] = [];
  for (const gap of gaps) {
    const d = deviations.find((dev) => deviationMatches(dev, gap));
    if (d) suppressed.push({ gap, deviation: d.id });
    else open.push(gap);
  }
  return { open, suppressed };
}
