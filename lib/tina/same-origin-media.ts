/**
 * Tina Cloud serves media picked in the editor from `https://assets.tina.io/<client id>/<path>`, while the
 * same file is committed under `public/uploads/<path>` (tina/config.ts: `mediaRoot: "uploads"`) and served
 * from this site's own origin. Most media doesn't care which host it comes from, but a CSS mask does: a
 * cross-origin mask image needs an `Access-Control-Allow-Origin` header, which assets.tina.io doesn't send,
 * so the browser drops it (#173: the Acacia Mission card's grid). This maps a Tina asset URL back to its
 * `/uploads/` path and leaves every other URL as it is, so the field stays editable in Tina.
 */
const TINA_ASSET = /^https:\/\/assets\.tina\.io\/[^/]+\/(.+)$/;

export function sameOriginMedia(src: string): string {
  const match = TINA_ASSET.exec(src);
  return match ? `/uploads/${match[1]}` : src;
}
