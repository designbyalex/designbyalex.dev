"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Pins `<meta name="theme-color">` to the theme the page is showing (#179). The layout's viewport export
 * emits one tag per OS colour scheme, which is right for first paint, but the site defaults to dark and has
 * its own toggle, so the OS preference can disagree with the page. Once the theme is resolved, both tags
 * take the live `--background`, keeping the browser chrome on the page colour.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    // next-themes swaps the <html> class in its own effect; read the token a frame later, once it has.
    const frame = requestAnimationFrame(() => {
      const color = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
      if (!color) return;
      for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
        meta.content = color;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  return null;
}
