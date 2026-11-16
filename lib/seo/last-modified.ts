import { execFileSync } from 'node:child_process';

/**
 * When a content file last changed, from git (#179): Tina's `_sys` carries no dates and the schema has no
 * date field, so the commit history is the only record. Read at build time only — the sitemap is static
 * and every Tina content commit redeploys — because a Vercel function has no `.git` to read.
 *
 * Vercel builds from a shallow clone, so a file untouched within the cloned depth reports the oldest
 * cloned commit's date: later than the real change, never earlier, which at worst asks a crawler to
 * look again. Returns undefined when git or the file's history is unavailable.
 */
export function gitLastModified(path: string, cwd: string = process.cwd()): string | undefined {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return date || undefined;
  } catch {
    return undefined;
  }
}
