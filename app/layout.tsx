import React from "react";
import { Metadata } from "next";
import { Inter_Tight, Space_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { VideoDialogProvider } from "@/components/ui/VideoDialogContext";
import VideoDialog from "@/components/ui/VideoDialog";

import "@/styles.css";
import { TailwindIndicator } from "@/components/ui/breakpoint-indicator";
import { ThemeProvider } from "@/components/theme/theme-provider";

const fontSans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Alexander Blum | UX • Product Design",
  description:
    "Alex is a Sydney-based product designer with 3+ years' experience crafting human-centred products.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(fontSans.variable, fontMono.variable)}
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
      </body>
    </html>
  );
}
