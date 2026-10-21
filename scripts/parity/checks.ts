// The comparator's checks and the Dimension each one's Gaps count towards (CONTEXT.md: Dimension).
// Motion has none: the site owner judges it at Parity sign-off. Theme and Contrast hold the Net-new
// (light) theme to its pre-Cutover bar (#67, theme.ts): the Build in light against the Build in dark, and
// AA contrast for every text run in light.

export type Dimension = 'Copy' | 'Media' | 'Layout' | 'Type' | 'Theme' | 'Contrast';

/** Every check the comparator runs, with the Dimension its Gaps count towards. */
export const CHECKS = {
  // Copy
  'copy-missing': 'Copy',
  'copy-changed': 'Copy',
  'copy-extra': 'Copy',
  punctuation: 'Copy',
  // Curly versus straight quotes and nothing else, so a site-wide quote-style Deviation can't hide other punctuation.
  'quote-style': 'Copy',
  case: 'Copy',
  'link-missing': 'Copy',
  'link-extra': 'Copy',
  'link-target': 'Copy',
  status: 'Copy',
  title: 'Copy',
  // Type
  'font-family': 'Type',
  'font-size': 'Type',
  'line-height': 'Type',
  'font-weight': 'Type',
  tracking: 'Type',
  color: 'Type',
  'font-style': 'Type',
  // Layout
  position: 'Layout',
  width: 'Layout',
  lines: 'Layout',
  opacity: 'Layout',
  'wrong-section': 'Layout',
  'section-missing': 'Layout',
  'section-extra': 'Layout',
  'section-size': 'Layout',
  // Media
  'media-missing': 'Media',
  'media-extra': 'Media',
  'media-host': 'Media',
  'media-position': 'Media',
  'media-size': 'Media',
  'media-radius': 'Media',
  'media-fit': 'Media',
  'video-autoplay': 'Media',
  'video-attributes': 'Media',
  // Theme: the light Build against the dark Build, per Section and width
  'theme-layout': 'Theme',
  'theme-media': 'Theme',
  'theme-copy': 'Theme',
  // Contrast: a text run in light below WCAG AA against its rendered background
  contrast: 'Contrast',
} as const satisfies Record<string, Dimension>;

export type Check = keyof typeof CHECKS;
export const DIMENSIONS: Dimension[] = ['Copy', 'Media', 'Layout', 'Type', 'Theme', 'Contrast'];

/** A count of 0 for every Dimension. */
export const zeroCounts = (): Record<Dimension, number> => Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<Dimension, number>;
