import React from "react";
import { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { cn } from "@/lib/utils";
import { VideoDialogProvider } from "@/components/ui/VideoDialogContext";
import VideoDialog from "@/components/ui/VideoDialog";

import "@/styles.css";
import { TailwindIndicator } from "@/components/ui/breakpoint-indicator";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { RouteTransitions } from "@/components/motion-primitives/route-transitions";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteDefaults } from "@/lib/seo/site";

// Inter with its optical-size axis (ADR 0003): styles.css pins opsz 14 for text
// (`font-sans`) and opsz 32 for headings (`font-display`), the Reference's
// "Inter" and "Inter Display". Tailwind's --font-sans/--font-display/--font-mono
// are built from these two variables.
const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  axes: ["opsz"],
});

const fontMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

// Material Icons, for the one ligature glyph the Reference draws with it: the
// "download" icon beside the CV link (docs/parity-audit.md H13). Self-hosted from
// app/fonts (OFL; Google's v145 build via @fontsource/material-icons 5.3.0) under
// its real family name, which the Fidelity gate compares with the Reference's. Not
// preloaded: only the homepage uses it. `block` hides the ligature text until the
// glyphs arrive, and an icon font needs no fallback metrics.
const fontIcons = localFont({
  src: "./fonts/material-icons-400.woff2",
  variable: "--font-material-icons",
  weight: "400",
  display: "block",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "font-family", value: "Material Icons" }],
});

// Site-wide fallback (S9 / #13): every route overrides this via generateMetadata;
// routes without one (404, styleguide) inherit the live site's title, description
// and share image, but no canonical/OG URL (those are per-page). metadataBase lets
// Next resolve any relative OG image a page might emit.
const { title, description, openGraph, twitter } = buildPageMetadata({ slug: "home" }, siteDefaults);
export const metadata: Metadata = {
  metadataBase: new URL(siteDefaults.baseUrl),
  title,
  description,
  openGraph: { ...openGraph, url: undefined },
  twitter,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // RouteTransitions is a context provider (no DOM): it wraps <html> as the
    // next-view-transitions docs prescribe so every route change can animate.
    <RouteTransitions>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(fontInter.variable, fontMono.variable, fontIcons.variable)}
      >
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <VideoDialogProvider>
              {children}
              <VideoDialog />
            </VideoDialogProvider>
          </ThemeProvider>
          <TailwindIndicator />
          <Analytics />
        </body>
      </html>
    </RouteTransitions>
  );
}
