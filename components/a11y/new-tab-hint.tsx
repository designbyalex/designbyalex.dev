/**
 * Screen-reader-only suffix for a link that opens a new tab (#178, WCAG 3.2.5): sighted
 * visitors see no change, assistive tech hears "(opens in a new tab)" after the link text.
 */
export const NewTabHint = () => <span className="sr-only"> (opens in a new tab)</span>;
