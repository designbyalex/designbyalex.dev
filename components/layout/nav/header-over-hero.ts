/**
 * Whether the fixed header sits over the home hero (#89): there it keeps the
 * dark theme's white chrome in either theme. The header's styling reads one
 * attribute, `data-over-hero="true|false"`, so the server render, a
 * pre-hydration script and the hydrated header all drive the same thing.
 *
 * - The server renders `true` on `/` (it can't know the scroll position, and
 *   the top of the page is the common case), `false` elsewhere.
 * - {@link trackHeaderOverHeroScript} runs as the parser reaches the header and
 *   keeps the attribute in step with the scroll position until hydration, so a
 *   mid-page reload drops to the theme's styling as soon as the browser
 *   restores the scroll position, instead of leaving a white header on a white
 *   page until the bundle runs.
 * - After hydration the header's own listener takes over and calls the global
 *   stop function this script leaves behind.
 */

/** The global the pre-hydration script leaves to stop itself. */
export const HEADER_PRE_HYDRATION_STOP = '__stopHeaderOverHero';

/**
 * True while the hero's bottom edge is still below the header's.
 * `heroBottom` is in page coordinates, so it can be measured once per layout.
 */
export const isOverHero = (scrollY: number, headerHeight: number, heroBottom: number) => scrollY + headerHeight < heroBottom;

/**
 * Serialised into the inline script, so self-contained: only literals and
 * browser globals. Keeps `header`'s `data-over-hero` attribute in step with the
 * home hero on scroll (the browser fires one when it restores the position).
 */
export function trackHeaderOverHero(header: HTMLElement | null | undefined): void {
  if (!header) return;
  const update = () => {
    const hero = document.querySelector('[data-section="hero"]');
    if (!hero) return;
    header.setAttribute('data-over-hero', hero.getBoundingClientRect().bottom > header.offsetHeight ? 'true' : 'false');
  };
  window.addEventListener('scroll', update, { passive: true });
  document.addEventListener('DOMContentLoaded', update);
  (window as unknown as Record<string, () => void>).__stopHeaderOverHero = () => {
    window.removeEventListener('scroll', update);
    document.removeEventListener('DOMContentLoaded', update);
  };
}

/** The inline script, placed straight after the `<header>` in the server HTML. */
export const trackHeaderOverHeroScript = `(${trackHeaderOverHero.toString()})(document.currentScript&&document.currentScript.previousElementSibling)`;
