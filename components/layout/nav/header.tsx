"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { tinaField } from "tinacms/dist/react";
import { cn } from "@/lib/utils";
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
  const pathname = usePathname();
  const headerRef = React.useRef<HTMLElement>(null);
  const [overHero, setOverHero] = React.useState(false);

  // While the header overlaps the home hero it keeps the dark theme's white
  // chrome whatever the theme (#89, the owner's #52 sign-off): near-black on
  // the gradient doesn't read. `[data-section="hero"]` only renders on /, so
  // every other page keeps the theme's own styling. The swap is a colour
  // transition below; the sitewide reduced-motion rule makes it instant.
  React.useEffect(() => {
    const hero = document.querySelector('[data-section="hero"]');
    if (!hero) {
      setOverHero(false);
      return;
    }
    let heroBottom = 0;
    let frame = 0;
    const sample = () => {
      frame = 0;
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      setOverHero(window.scrollY + headerHeight < heroBottom);
    };
    const measure = () => {
      heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
      sample();
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(sample);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <HideOnScroll className="fixed inset-x-0 top-0 z-20">
      <header ref={headerRef} data-section="header" className="flex items-center justify-between px-6 pb-4 pt-6 lg:px-12 lg:pb-6">
        <TransitionLink
          href="/"
          aria-label="Homepage"
          className="flex size-12 shrink-0 items-center justify-center rounded-md"
        >
          {/* The mark follows the page foreground — white in dark (as live), near-black in light — except over the home hero, where it stays white. */}
          <Icon
            parentColor={header.color!}
            data={{ name: header.icon!.name, color: header.icon!.color, style: header.icon!.style, size: "custom" }}
            className={cn(
              "h-[33px] w-[35px] opacity-100 transition-colors duration-300",
              overHero ? "text-on-image" : "text-foreground"
            )}
          />
        </TransitionLink>

        <div className="flex items-center gap-6">
          {/* Over the hero in light, the toggle takes the dark theme's translucent look (the dark: classes already win in dark). */}
          <ThemeToggle className={cn(overHero && "border-on-image/25 bg-scrim/20 text-on-image hover:bg-scrim/35 hover:text-on-image")} />
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
                      className={cn(
                        "group flex items-center gap-3 rounded-full text-body-lg transition-colors duration-300",
                        overHero ? "text-on-image" : "text-foreground"
                      )}
                      data-tina-field={tinaField(item!, "label")}
                    >
                      <span>{item!.label}</span>
                      {/* Reference hover: the circle grows 40→44px and the arrow rolls out to the right as a second one enters from the left. */}
                      {/* The arrow is black on the green circle in both themes (#89 sign-off; the Reference's white is a deliberate departure). */}
                      <span
                        aria-hidden
                        className="relative size-10 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground transition-transform duration-300 ease-out group-hover:scale-110"
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
