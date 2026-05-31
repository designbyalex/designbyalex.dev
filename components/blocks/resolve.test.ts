import { describe, expect, it } from 'vitest';
import { blockTypeKey, resolveBlockComponent } from './resolve';

describe('blockTypeKey', () => {
  it('derives the template key from a page block typename', () => {
    expect(blockTypeKey('PageBlocksHero')).toBe('Hero');
    expect(blockTypeKey('PageBlocksCta')).toBe('Cta');
  });

  it('maps project and page blocks to the same key (cross-collection)', () => {
    expect(blockTypeKey('ProjectBlocksHero')).toBe(blockTypeKey('PageBlocksHero'));
    expect(blockTypeKey('ProjectBlocksContent')).toBe('Content');
  });

  it('returns null for unknown or malformed typenames', () => {
    expect(blockTypeKey(undefined)).toBeNull();
    expect(blockTypeKey(null)).toBeNull();
    expect(blockTypeKey('')).toBeNull();
    expect(blockTypeKey('garbage')).toBeNull();
    expect(blockTypeKey('PageBlocks')).toBeNull();
    // @ts-expect-error — guards against non-string runtime values
    expect(blockTypeKey(42)).toBeNull();
  });
});

describe('resolveBlockComponent', () => {
  const registry = { Hero: 'HeroComponent', Content: 'ContentComponent' } as const;

  it('maps a known __typename to its registered component', () => {
    expect(resolveBlockComponent('PageBlocksHero', registry)).toBe('HeroComponent');
    expect(resolveBlockComponent('ProjectBlocksContent', registry)).toBe('ContentComponent');
  });

  it('safely returns null for a typename with no registered component', () => {
    expect(resolveBlockComponent('PageBlocksMystery', registry)).toBeNull();
  });

  it('safely returns null for unknown or malformed typenames', () => {
    expect(resolveBlockComponent(undefined, registry)).toBeNull();
    expect(resolveBlockComponent(null, registry)).toBeNull();
    expect(resolveBlockComponent('not-a-block', registry)).toBeNull();
  });
});
