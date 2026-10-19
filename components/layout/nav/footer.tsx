"use client";
import React from "react";
import { TransitionLink as Link } from "../../motion-primitives/route-transitions";
import { Icon } from "../../icon";
import { useLayout } from "../layout-context";

// Accessible names for icon-only social links, keyed by the Tina icon name.
const socialLabels: Record<string, string> = {
  FaLinkedin: "LinkedIn",
  FaGithub: "GitHub",
  FaYoutube: "YouTube",
  FaXTwitter: "X (Twitter)",
  FaFacebookF: "Facebook",
  AiFillInstagram: "Instagram",
};

/** Fall back to the link's hostname when the icon has no known label. */
function socialLabel(iconName: string | null | undefined, url: string): string {
  if (iconName && socialLabels[iconName]) return socialLabels[iconName];
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Social link";
  }
}

export const Footer = () => {
  const { globalSettings } = useLayout();
  const { header, footer } = globalSettings!;

  return (
    // The Reference footer band is 515px tall up to 768 and 277.6px at 1440; #56 fills it.
    <footer data-section="footer" className="min-h-[515px] border-b bg-white pt-20 lg:min-h-[278px] dark:bg-transparent">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mt-12 flex flex-wrap items-center gap-6 border-t py-6 flex-col md:flex-row md:justify-between">

          <div className="order-last flex justify-center md:order-first md:justify-start">
            <Link href="/" aria-label="go home" className="rounded-md">
              <Icon
                parentColor={header!.color!}
                data={header!.icon}
                className="text-foreground opacity-100"
              />
            </Link>
            {/* Reference footer bar: Space Mono, uppercase, grey */}
            <span className="ml-2 self-center font-mono text-mono uppercase text-muted-foreground">© {new Date().getFullYear()} {header?.name}, All rights reserved</span>
          </div>

          <div className="order-first flex justify-center gap-6 text-caption md:order-last md:justify-end">
            {footer?.social?.map((link, index) => (
              <Link
                key={`${link!.icon}${index}`}
                href={link!.url!}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${socialLabel(link!.icon?.name, link!.url!)} (opens in a new tab)`}
                className="rounded-md"
              >
                <Icon data={{ ...link!.icon, size: 'small' }} className="text-muted-foreground hover:text-emphasis block" />
              </Link>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}
