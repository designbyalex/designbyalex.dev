"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { tinaField } from "tinacms/dist/react";
import { TransitionLink } from "../../motion-primitives/route-transitions";
import { HideOnScroll } from "../../motion-primitives/hide-on-scroll";
import { Icon } from "../../icon";
import { useLayout } from "../layout-context";
import { ThemeToggle } from "../../theme/theme-toggle";

/** mailto:, tel: and http(s) links leave the site: open them in a new tab, as the Reference does. */
const isExternal = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);

/**
 * Global header, faithful to the Reference (`docs/parity-audit.md` §2.3):
 * transparent over the content, the white mark alone on the left and, on the
 * right, "Let's talk" at 20px with a 40px green arrow circle. No name, no
 * hamburger at any width. It hides on scroll down and returns on scroll up
 * through `HideOnScroll`; the theme toggle beside the call to action is an
 * approved Deviation.
 *
 * Measured box: a 48px row with 24px above; 24px below and 48px side gutters
 * at ≥1024 (96px tall), 16px below and 24px gutters under that (88px tall).
 */
export const Header = () => {
  const { globalSettings } = useLayout();
  const header = globalSettings!.header!;

  return (
    <HideOnScroll className="fixed inset-x-0 top-0 z-20">
      <header data-section="header" className="flex items-center justify-between px-6 pb-4 pt-6 lg:px-12 lg:pb-6">
        <TransitionLink
          href="/"
          aria-label="Homepage"
          className="flex size-12 shrink-0 items-center justify-center rounded-md"
        >
          {/* The mark follows the page foreground: white in dark (as live), near-black in light. */}
          <Icon
            parentColor={header.color!}
            data={{ name: header.icon!.name, color: header.icon!.color, style: header.icon!.style, size: "custom" }}
            className="h-[33px] w-[35px] text-foreground opacity-100"
          />
        </TransitionLink>

        <div className="flex items-center gap-6">
          <ThemeToggle />
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-6">
              {header.nav!.map((item, index) => {
                const href = item!.href!;
                const external = isExternal(href);
                const LinkTag = external ? "a" : TransitionLink;
                return (
                  <li key={`${href}${index}`}>
                    <LinkTag
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener" } : {})}
                      className="group flex items-center gap-3 rounded-full text-body-lg text-foreground"
                      data-tina-field={tinaField(item!, "label")}
                    >
                      <span>{item!.label}</span>
                      {/* Reference hover: the circle grows 40→44px and the arrow rolls out to the right as a second one enters from the left. */}
                      <span
                        aria-hidden
                        className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary text-foreground transition-transform duration-300 ease-out group-hover:scale-110"
                      >
                        <ArrowRight
                          strokeWidth={1.6}
                          className="absolute inset-0 m-auto size-6 transition-transform duration-300 ease-out group-hover:translate-x-10"
                        />
                        <ArrowRight
                          strokeWidth={1.6}
                          className="absolute inset-0 m-auto size-6 -translate-x-10 transition-transform duration-300 ease-out group-hover:translate-x-0"
                        />
                      </span>
                    </LinkTag>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
    </HideOnScroll>
  );
};
