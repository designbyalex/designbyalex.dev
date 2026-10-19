"use client";
import React from "react";
import { ArrowUpRight } from "lucide-react";
import { tinaField } from "tinacms/dist/react";
import { TransitionLink } from "../../motion-primitives/route-transitions";
import { Icon } from "../../icon";
import { useLayout } from "../layout-context";

/** Only http(s) links open in a new tab, as the Reference footer does; mailto: and routes stay in-tab. */
const isExternal = (href: string) => /^https?:\/\//i.test(href);

/**
 * Global footer, faithful to the Reference (`docs/parity-audit.md` §2.3): the raised
 * `card` band with the bare mark, the "Let's talk / Get in touch ↗" invitation, the
 * small text links and a bottom bar in Space Mono ("<year> Alexander Blum" and
 * "♥ Made with love ♥"). Everything is Global content.
 *
 * Measured box (Framer's own CSS): the top row has 64px vertical and 48px side
 * padding at desktop with a 56px logo area; the right group fills the row and
 * spreads the invitation and the links with `space-around`. Under 1024 the band is
 * a fixed 515px, a 532px column with 24px gutters, and the right group fills the
 * column with the same `space-around`, so the links stack as on the Reference.
 * The bottom bar is 44px with 24px gutters at every width.
 */
export const Footer = () => {
  const { globalSettings } = useLayout();
  const { header, footer } = globalSettings!;
  const cta = footer?.cta;
  const links = footer?.links?.filter(Boolean) ?? [];
  const year = new Date().getFullYear();

  return (
    <footer data-section="footer" className="flex min-h-[515px] flex-col bg-card text-card-foreground lg:min-h-0">
      <div className="mx-auto flex w-full max-w-[532px] flex-1 flex-col items-start px-6 py-16 lg:max-w-[1440px] lg:flex-row lg:justify-between lg:px-12">
        <TransitionLink
          href="/"
          aria-label="Homepage"
          className="flex shrink-0 items-center justify-center rounded-md lg:size-14"
        >
          {/* The mark follows the page foreground: white in dark (as live), near-black in light. */}
          <Icon
            parentColor={header!.color!}
            data={{ name: header!.icon!.name, color: header!.icon!.color, style: header!.icon!.style, size: "custom" }}
            className="h-[33px] w-[35px] text-foreground opacity-100"
          />
        </TransitionLink>

        <div className="flex w-full flex-1 flex-col justify-around lg:flex-row lg:items-start">
          {cta && (
            <div className="flex flex-col items-start">
              {cta.heading && (
                // Framer gives this a fixed 48px box at desktop, so the link starts one em below it.
                <h2
                  className="whitespace-nowrap font-display text-h2 text-foreground lg:h-12"
                  data-tina-field={tinaField(cta, "heading")}
                >
                  {cta.heading}
                </h2>
              )}
              {cta.label && cta.href && (
                <a
                  href={cta.href}
                  className="group flex h-12 items-center gap-2 rounded-md whitespace-nowrap font-display text-h2 text-foreground transition-colors duration-300 ease-out hover:text-emphasis lg:h-[57.6px]"
                  data-tina-field={tinaField(cta, "label")}
                >
                  <span>{cta.label}</span>
                  {/* Reference: a 48px green ↗ (its 24-unit mask drawn at 48px, so a 20px arrow with a 4px stroke). On hover it rolls out to the right as a second one enters from the left. */}
                  <span aria-hidden className="relative size-12 shrink-0 overflow-hidden text-emphasis">
                    <ArrowUpRight
                      strokeWidth={2}
                      className="absolute inset-0 m-auto size-12 transition-transform duration-300 ease-out group-hover:translate-x-12"
                    />
                    <ArrowUpRight
                      strokeWidth={2}
                      className="absolute inset-0 m-auto size-12 -translate-x-12 transition-transform duration-300 ease-out group-hover:translate-x-0"
                    />
                  </span>
                </a>
              )}
            </div>
          )}

          {links.length > 0 && (
            <ul className="flex flex-col gap-1 lg:shrink-0 lg:gap-2.5">
              {links.map((link, index) => {
                if (!link!.href || !link!.label) return null;
                const external = isExternal(link!.href);
                const LinkTag = external ? "a" : TransitionLink;
                return (
                  <li key={`${link!.href}${index}`} className="flex h-[27px] items-center">
                    <LinkTag
                      href={link!.href}
                      {...(external ? { target: "_blank", rel: "noopener" } : {})}
                      className="rounded-sm whitespace-nowrap text-caption text-foreground transition-colors hover:text-emphasis"
                      data-tina-field={tinaField(link!, "label")}
                    >
                      {link!.label}
                    </LinkTag>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mx-auto flex h-11 w-full max-w-[532px] items-center justify-between gap-4 px-6 font-mono text-mono uppercase text-muted-foreground shadow-[0_-1px_0_0_var(--color-border)] lg:max-w-[1440px]">
        {footer?.name && (
          <p className="whitespace-nowrap" data-tina-field={tinaField(footer, "name")}>
            {year} {footer.name}
          </p>
        )}
        {footer?.tagline && (
          // `pre`: the Reference sets this with two spaces either side of the words, as the content does.
          <p className="whitespace-pre" data-tina-field={tinaField(footer, "tagline")}>
            {footer.tagline}
          </p>
        )}
      </div>
    </footer>
  );
};
