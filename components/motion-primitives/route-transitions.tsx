'use client';
import NextLink from 'next/link';
import { Link as ViewTransitionLink, ViewTransitions } from 'next-view-transitions';
import { useReducedMotion } from 'motion/react';
import type { ComponentProps, MouseEvent } from 'react';
import { routeTransitionMotion } from '@/lib/motion/reduced-motion';

/**
 * Route transitions (S8 / #12) — View Transitions API via `next-view-transitions`.
 *
 * `RouteTransitions` is the provider: it wraps the root layout and also runs
 * browser back/forward navigations through `document.startViewTransition`.
 * The crossfade itself is CSS on the `::view-transition-*` pseudo-elements in
 * `styles.css`, where `prefers-reduced-motion: reduce` turns every
 * view-transition animation off (covers the back/forward path).
 */
export const RouteTransitions = ViewTransitions;

export type TransitionLinkProps = ComponentProps<typeof NextLink>;

/** Internal, path-style hrefs get a view transition. Hashes and external URLs don't. */
function isInternalRoute(href: TransitionLinkProps['href']): boolean {
  if (typeof href !== 'string') return true;
  return href.startsWith('/') && !href.startsWith('//');
}

/**
 * Drop-in for `next/link` that animates the navigation with the View
 * Transitions API. Routes its decision through {@link routeTransitionMotion}:
 * with `prefers-reduced-motion` (or a hash / external href) it renders a plain
 * `next/link`, so the navigation is instant and no snapshot is ever taken.
 * Browsers without `startViewTransition` fall through to a normal navigation
 * inside the library.
 */
export function TransitionLink(props: TransitionLinkProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { animate } = routeTransitionMotion(prefersReducedMotion);
  const LinkTag = animate && isInternalRoute(props.href) ? ViewTransitionLink : NextLink;
  return <LinkTag {...props} />;
}

/** The slice of the Navigation API (`window.navigation`) that {@link backInSiteHistory} reads. */
interface SiteNavigationEntry {
  key: string;
  url: string | null;
  index: number;
}
interface SiteNavigation {
  currentEntry: SiteNavigationEntry | null;
  entries(): SiteNavigationEntry[];
  traverseTo(key: string): unknown;
}

/**
 * The nearest earlier history entry that is another page of this site (#184), skipping same-page hash
 * entries. The Navigation API lists only this origin's contiguous entries, so an empty answer means the
 * visitor landed here directly (a new tab, a search result, a shared link). Browsers without the API answer
 * undefined too, and keep the plain link.
 */
function previousSitePage(): { navigation: SiteNavigation; entry: SiteNavigationEntry } | undefined {
  const navigation = (window as Window & { navigation?: SiteNavigation }).navigation;
  const current = navigation?.currentEntry;
  if (!navigation || !current) return undefined;
  const here = new URL(window.location.href);
  const entries = navigation.entries();
  for (let i = current.index - 1; i >= 0; i--) {
    const url = entries[i]?.url;
    if (!url) continue;
    const there = new URL(url);
    if (there.origin === here.origin && there.pathname !== here.pathname) return { navigation, entry: entries[i] };
  }
  return undefined;
}

/**
 * Click handler for a "Back" link (#184): when the previous page in this tab is on the site, go back to it,
 * as the browser's own Back would (Next restores the page, #161's popstate path skips the Lenis glide and the
 * view transition runs as for any back navigation). Otherwise the click falls through to the link's `href`.
 * Middle-, modifier- and right-clicks are never intercepted, so open-in-new-tab still gets the `href`.
 */
export function backInSiteHistory(event: MouseEvent<HTMLAnchorElement>): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const previous = previousSitePage();
  if (!previous) return;
  event.preventDefault();
  previous.navigation.traverseTo(previous.entry.key);
}
