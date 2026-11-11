/**
 * The case-study hero entrance (#68): the pill, title and tagline rise out of
 * their clipped boxes and a page-coloured mask slides off the hero image,
 * opening it from the line under the headline.
 *
 * The motion itself is CSS (styles.css, "Case-study hero entrance"), not
 * motion/react: CSS transform animations run on the compositor, so they keep
 * playing smoothly while a cold first visit's main thread is busy parsing and
 * hydrating the bundle. A JS-driven tween stalls through those long tasks and
 * then jumps to its end, which is what made the band "stay black, then snap"
 * on first visits.
 *
 * The server renders the hero at rest. The CSS start state only applies with
 * `@media (scripting: enabled)` and no reduced-motion preference, so without
 * JavaScript, or with reduced motion, the hero is simply there from the first
 * paint. The headline rises from the first paint; the mask waits for this
 * function to mark the hero ready once its image has decoded, so the band
 * never opens over nothing.
 */

/** The attribute that starts the mask animation (styles.css). */
export const HERO_READY_ATTRIBUTE = 'data-hero-ready';

/** Longest the mask waits for the image, in ms, before opening anyway. */
export const HERO_READY_CAP_MS = 2500;

/**
 * Marks `root` ready once its first `<img>` has decoded (or failed, or after
 * {@link HERO_READY_CAP_MS}), whichever comes first. Idempotent.
 *
 * It is serialised into an inline script ({@link armHeroEntranceScript}), so it
 * stays self-contained: no imports, no module constants, only literals and
 * browser globals.
 */
export function armHeroEntrance(root: Element | null | undefined): void {
  if (!root || root.hasAttribute('data-hero-ready')) return;
  let done = false;
  const ready = () => {
    if (done) return;
    done = true;
    root.setAttribute('data-hero-ready', '');
  };
  const image = root.querySelector('img');
  if (image && typeof image.decode === 'function') {
    image.decode().then(ready, ready);
  } else {
    ready();
  }
  setTimeout(ready, 2500);
}

/**
 * The same function as an inline script for the server render: it runs as the
 * parser reaches the end of the hero, before the bundle has loaded, so a hard
 * load doesn't wait for hydration to open the band.
 */
export const armHeroEntranceScript = `(${armHeroEntrance.toString()})(document.currentScript&&document.currentScript.parentElement)`;
