import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The type ramp's tiers (styles.css `--text-*`). tailwind-merge only knows Tailwind's own
 * `text-sm`… sizes, so without this `text-body` would be read as a colour and both it and
 * a component's `text-sm` would survive the merge. Listing the tiers as font sizes lets a
 * block's tier override a primitive's default (Button's `text-sm`).
 */
export const typeTiers = ['display', 'h1', 'h2', 'heading', 'lead', 'statement', 'body-lg', 'body', 'caption', 'mono'] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...typeTiers] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
