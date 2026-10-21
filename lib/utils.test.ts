import { describe, expect, it } from 'vitest';
import { cn, typeTiers } from './utils';

describe('cn', () => {
  it('lets a type-ramp tier override a primitive default size', () => {
    // Button sets `text-sm`; a block passing `text-body` must win, not sit beside it.
    expect(cn('text-sm', 'text-body')).toBe('text-body');
    expect(cn('text-body', 'text-sm')).toBe('text-sm');
  });

  it('treats every ramp tier as a font size, not a colour', () => {
    for (const tier of typeTiers) {
      expect(cn('text-lg', `text-${tier}`)).toBe(`text-${tier}`);
      // A colour utility is a different group and survives next to the tier.
      expect(cn(`text-${tier}`, 'text-foreground')).toBe(`text-${tier} text-foreground`);
    }
  });

  it('keeps the last of two ramp tiers', () => {
    expect(cn('text-caption', 'text-heading')).toBe('text-heading');
  });

  it('merges conditional inputs like clsx', () => {
    expect(cn('a', false && 'b', undefined, ['c', { d: true, e: false }])).toBe('a c d');
  });
});
