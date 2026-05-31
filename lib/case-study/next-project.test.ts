import { describe, expect, it } from 'vitest';
import { resolveAdjacentProjects, sortProjects } from './next-project';

const projects = [
  { slug: 'acacia', title: 'Acacia', order: 2 },
  { slug: 'birch', title: 'Birch', order: 1 },
  { slug: 'cedar', title: 'Cedar', order: 3 },
];

describe('sortProjects', () => {
  it('sorts by ascending order', () => {
    expect(sortProjects(projects).map((p) => p.slug)).toEqual(['birch', 'acacia', 'cedar']);
  });

  it('sinks projects without an order to the end, tie-broken by title', () => {
    const mixed = [
      { slug: 'z', title: 'Zed' },
      { slug: 'a', title: 'Alpha' },
      { slug: 'b', title: 'Beta', order: 0 },
    ];
    expect(sortProjects(mixed).map((p) => p.slug)).toEqual(['b', 'a', 'z']);
  });
});

describe('resolveAdjacentProjects', () => {
  it('returns the sorted neighbours of a middle project', () => {
    const { next, prev } = resolveAdjacentProjects(projects, 'acacia');
    expect(prev?.slug).toBe('birch');
    expect(next?.slug).toBe('cedar');
  });

  it('wraps cyclically at the start', () => {
    const { next, prev } = resolveAdjacentProjects(projects, 'birch');
    expect(prev?.slug).toBe('cedar'); // wraps to the last
    expect(next?.slug).toBe('acacia');
  });

  it('wraps cyclically at the end', () => {
    const { next, prev } = resolveAdjacentProjects(projects, 'cedar');
    expect(prev?.slug).toBe('acacia');
    expect(next?.slug).toBe('birch'); // wraps to the first
  });

  it('returns nulls for an unknown slug', () => {
    expect(resolveAdjacentProjects(projects, 'missing')).toEqual({ next: null, prev: null });
  });

  it('returns nulls when there is only one project', () => {
    expect(resolveAdjacentProjects([{ slug: 'solo', title: 'Solo', order: 1 }], 'solo')).toEqual({
      next: null,
      prev: null,
    });
  });
});
