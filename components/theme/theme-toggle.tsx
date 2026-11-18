'use client';

import { Moon, Sun } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { themePourMotion } from '@/lib/motion/reduced-motion';
import { cn } from '@/lib/utils';

type ThemePourModule = typeof import('./theme-pour');

// Outside the component, so a pour survives the header remounting on a route change.
let pourModule: ThemePourModule | null = null;
let pouring = false;
let queued = false;

/** Fetch the pour once the page is idle. A click before it lands swaps the theme instantly, so nothing waits on it. */
function preloadPour() {
  const load = () => {
    void import('./theme-pour').then((module) => {
      pourModule = module;
    });
  };
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(load);
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(load, 1500);
  return () => clearTimeout(id);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const motion = themePourMotion(useReducedMotion() ?? false);
  React.useEffect(() => {
    if (motion.animate) return preloadPour();
  }, [motion.animate]);

  const isDark = resolvedTheme === 'dark';
  // Before hydration the theme is unknown, so the label stays generic.
  const label = mounted ? `Switch to ${isDark ? 'light' : 'dark'} theme` : 'Toggle theme';

  const switchTo = (next: 'dark' | 'light', origin: { x: number; y: number }) => {
    const started =
      motion.animate &&
      pourModule?.pourTheme({
        dark: next === 'dark',
        origin,
        durationMs: motion.durationMs,
        applyTheme: () => setTheme(next),
        onToggleClick: () => {
          queued = !queued;
        },
        onDone: () => {
          pouring = false;
          if (!queued) return;
          queued = false;
          switchTo(next === 'dark' ? 'light' : 'dark', origin);
        },
      });
    if (started) pouring = true;
    else setTheme(next);
  };

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // A click mid-pour lets the pour finish, then switches back. Another click cancels that.
    if (pouring) {
      queued = !queued;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    switchTo(isDark ? 'light' : 'dark', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <Button variant='outline' size='icon' className={cn('rounded-full', className)} aria-label={label} title={label} onClick={onClick}>
      {mounted ? isDark ? <Sun aria-hidden className='size-4' /> : <Moon aria-hidden className='size-4' /> : <span className='size-4' />}
    </Button>
  );
}
