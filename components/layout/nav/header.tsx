"use client";

import React from "react";
import { TransitionLink as Link } from "../../motion-primitives/route-transitions";
import { Icon } from "../../icon";
import { useLayout } from "../layout-context";
import { ThemeToggle } from "../../theme/theme-toggle";
import { Menu, X } from "lucide-react";

export const Header = () => {
  const { globalSettings, theme } = useLayout();
  const header = globalSettings!.header!;

  const [menuState, setMenuState] = React.useState(false)
  return (
    <header>
      <nav
        data-section="header"
        data-state={menuState && 'active'}
        className="site-header bg-background/50 fixed z-20 w-full border-b backdrop-blur-3xl">
        <div className="mx-auto max-w-6xl px-6 transition-all duration-300">
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full items-center justify-between gap-12">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center space-x-2 rounded-md">
                <Icon
                  parentColor={header.color!}
                  data={{
                    name: header.icon!.name,
                    color: header.icon!.color,
                    style: header.icon!.style,
                  }}
                />{" "}
                <span>
                  {header.name}
                </span>
              </Link>

              <div className="flex items-center gap-3 lg:hidden">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                  aria-expanded={menuState}
                  aria-controls="site-menu"
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer rounded-md p-2.5">
                  <Menu aria-hidden className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                  <X aria-hidden className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                </button>
              </div>

              <div className="hidden items-center gap-8 lg:flex">
                <ul className="flex gap-8 text-sm">
                  {header.nav!.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item!.href!}
                        className="text-muted-foreground hover:text-accent-foreground block rounded-sm duration-150">
                        <span>{item!.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <ThemeToggle />
              </div>
            </div>

            <div id="site-menu" className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {header.nav!.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item!.href!}
                        className="text-muted-foreground hover:text-accent-foreground block rounded-sm duration-150">
                        <span>{item!.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
