'use client';

import { Moon, Sun } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { themeBoilMotion } from '@/lib/motion/reduced-motion';
import { cn } from '@/lib/utils';

type ThemeBoilModule = typeof import('./theme-boil');

// Outside the component, so a switch survives the header remounting on a route change.
let boilModule: ThemeBoilModule | null = null;
let switching = false;
let queued = false;

/** Fetch the animation once the page is idle. A click before it lands swaps the theme instantly, so nothing waits on it. */
function preloadBoil() {
  const load = () => {
    void import('./theme-boil').then((module) => {
      boilModule = module;
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

  const motion = themeBoilMotion(useReducedMotion() ?? false);
  React.useEffect(() => {
    if (motion.animate) return preloadBoil();
  }, [motion.animate]);

  const isDark = resolvedTheme === 'dark';
  // Before hydration the theme is unknown, so the label stays generic.
  const label = mounted ? `Switch to ${isDark ? 'light' : 'dark'} theme` : 'Toggle theme';

  const switchTo = (next: 'dark' | 'light', origin: { x: number; y: number }) => {
    const started =
      motion.animate &&
      boilModule?.boilTheme({
        dark: next === 'dark',
        origin,
        durationMs: motion.durationMs,
        applyTheme: () => setTheme(next),
        onToggleClick: () => {
          queued = !queued;
        },
        onDone: () => {
          switching = false;
          if (!queued) return;
          queued = false;
          switchTo(next === 'dark' ? 'light' : 'dark', origin);
        },
      });
    if (started) switching = true;
    else setTheme(next);
  };

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // A click mid-switch lets the circle finish, then switches back. Another click cancels that.
    if (switching) {
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
