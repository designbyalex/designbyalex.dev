import { describe, expect, it } from 'vitest';
import { sameOriginMedia } from './same-origin-media';

describe('sameOriginMedia', () => {
  it('maps a Tina Cloud asset URL to its /uploads path on this origin', () => {
    expect(
      sameOriginMedia('https://assets.tina.io/a2354178-0d3a-4c38-a34e-cedfa7501dba/projects/acacia/mission-grid.svg'),
    ).toBe('/uploads/projects/acacia/mission-grid.svg');
  });

  it('leaves local and other hosts alone', () => {
    expect(sameOriginMedia('/uploads/projects/acacia/mission-grid.svg')).toBe('/uploads/projects/acacia/mission-grid.svg');
    expect(sameOriginMedia('https://res.cloudinary.com/demo/image.svg')).toBe('https://res.cloudinary.com/demo/image.svg');
  });
});
