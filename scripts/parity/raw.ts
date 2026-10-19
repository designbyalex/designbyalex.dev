// What the in-page collector hands back to Node: DOM facts with no interpretation yet.
// build-snapshot.ts turns it into a PageSnapshot.
import type { Box, MediaKind, TextStyle, VideoPlayback } from './snapshot.ts';

/** How to find Sections on a page. Rules are tried in order; an element matched by an earlier rule wins. */
export interface SectionRule {
  selector: string;
  /** Fixed Section name: every match is unioned into one Section of this name. */
  name?: string;
  /** Otherwise each match is its own Section, named by this attribute's value. */
  nameAttribute?: string;
  /** Keep only matches with no matching ancestor (for attributes that also mark nested layers). */
  outermost?: boolean;
}

export interface RawSection {
  name: string;
  /** True when the rule gave a fixed name, so same-named matches merge into one Section. */
  grouped: boolean;
  box: Box;
}

/** One DOM text node. Whitespace-only nodes are kept (with no rects) so words on either side still join. */
export interface RawFragment {
  text: string;
  space: boolean;
  block: number;
  link: number | null;
  /** One rect per line box the node occupies, page coordinates. */
  rects: Box[];
  style: TextStyle;
  opacity: number;
}

export interface RawBlock {
  tag: string;
  section: number | null;
  box: Box;
}

export interface RawLink {
  text: string;
  href: string;
  target: string | null;
  rel: string | null;
  section: number | null;
  box: Box;
}

export interface RawMedia {
  kind: MediaKind;
  src: string;
  alt: string | null;
  section: number | null;
  box: Box;
  natural: { w: number; h: number } | null;
  fit: string;
  radius: number;
  video: VideoPlayback | null;
}

export interface RawCapture {
  title: string;
  generator: string | null;
  pageHeight: number;
  clientWidth: number;
  fonts: string[];
  sections: RawSection[];
  blocks: RawBlock[];
  fragments: RawFragment[];
  links: RawLink[];
  media: RawMedia[];
}
