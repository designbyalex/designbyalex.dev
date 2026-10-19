'use client';
import NextLink from 'next/link';
import { Link as ViewTransitionLink, ViewTransitions } from 'next-view-transitions';
import { useReducedMotion } from 'motion/react';
import type { ComponentProps } from 'react';
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
