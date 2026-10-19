// The comparator's checks and the Dimension each one's Gaps count towards (CONTEXT.md: Dimension).
// Motion has none: the site owner judges it at Parity sign-off.

export type Dimension = 'Copy' | 'Media' | 'Layout' | 'Type';

/** Every check the comparator runs, with the Dimension its Gaps count towards. */
export const CHECKS = {
  // Copy
  'copy-missing': 'Copy',
  'copy-changed': 'Copy',
  'copy-extra': 'Copy',
  punctuation: 'Copy',
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
} as const satisfies Record<string, Dimension>;

export type Check = keyof typeof CHECKS;
export const DIMENSIONS: Dimension[] = ['Copy', 'Media', 'Layout', 'Type'];
