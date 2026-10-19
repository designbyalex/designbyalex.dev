import type { SectionRule } from './raw.ts';

// Reference site (Framer): Sections are Framer's own layer names (`data-framer-name`), as listed in
// docs/parity-audit.md §1. The nav and footer layers carry their variant name ("Desktop", "Mobile Closed"),
// so those two get fixed names. Below `main`, each outermost named layer is a Section.
export const REFERENCE_SECTIONS: SectionRule[] = [
  { selector: 'nav[data-framer-name]', name: 'Header' },
  { selector: 'footer[data-framer-name]', name: 'Footer' },
  // The case-study hero image is a sibling of the title layer; both read as one hero.
  { selector: '[data-framer-name="Project Hero"], [data-framer-name="Hero Image"]', name: 'Project Hero' },
  { selector: '[data-framer-name="Hero Content"]', name: 'Hero Content' },
  // The sticky "← Back" pill on case studies, outside the page wrapper.
  { selector: '[data-framer-name="Back"]:not(main *)', name: 'Back', outermost: true },
  { selector: 'main [data-framer-name]', nameAttribute: 'data-framer-name', outermost: true },
];

// Build: each block root carries a stable Section identifier (see #46, Section map).
export const BUILD_SECTIONS: SectionRule[] = [{ selector: '[data-section]', nameAttribute: 'data-section', outermost: true }];
