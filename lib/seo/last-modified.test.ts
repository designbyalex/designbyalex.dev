import { describe, expect, it } from 'vitest';
import { gitLastModified } from './last-modified';

describe('gitLastModified', () => {
  it('reads a committed content file’s last commit date as ISO 8601', () => {
    expect(gitLastModified('content/pages/home.mdx')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });

  it('returns undefined for a file git has never seen', () => {
    expect(gitLastModified('content/pages/does-not-exist.mdx')).toBeUndefined();
  });

  it('returns undefined outside a repository', () => {
    expect(gitLastModified('content/pages/home.mdx', '/')).toBeUndefined();
  });
});
