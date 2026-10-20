// Prints the comparator's Gaps for a person or an agent: grouped by page, Section, width and Dimension,
// with punctuation-only differences listed apart and Deviation suppressions counted.
import { type Comparison, DIMENSIONS, type Gap } from './compare.ts';

const isPunctuation = (g: Gap) => g.check === 'punctuation' || g.check === 'quote-style';
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const summary = (gaps: Gap[], suppressed: number) =>
  `${plural(gaps.filter((g) => !isPunctuation(g)).length, 'Gap')}, ${gaps.filter(isPunctuation).length} punctuation-only, ${suppressed} suppressed`;

export function formatReport(comparisons: Comparison[]): string {
  const out: string[] = [];
  const pages = [...new Set(comparisons.map((c) => `${c.path}\u0000${c.page}`))];
  for (const key of pages) {
    const [path, page] = key.split('\u0000');
    const group = comparisons.filter((c) => c.path === path && c.page === page);
    const gaps = group.flatMap((c) => c.gaps);
    const suppressed = group.flatMap((c) => c.suppressed);
    out.push(`${path} (${page}): ${summary(gaps, suppressed.length)}`);
    const main = gaps.filter((g) => !isPunctuation(g));
    for (const section of [...new Set(main.map((g) => g.section))]) {
      out.push(`  ${section}`);
      for (const c of group) {
        for (const dimension of DIMENSIONS) {
          const list = main.filter((g) => g.section === section && g.width === c.width && g.dimension === dimension);
          if (list.length === 0) continue;
          out.push(`    @${c.width} ${dimension}`, ...list.map((g) => `      ${g.message}`));
        }
      }
    }
    const punctuation = gaps.filter(isPunctuation);
    if (punctuation.length > 0) out.push('  Punctuation only', ...punctuation.map((g) => `      ${g.message}`));
    if (suppressed.length > 0) {
      const counts = new Map<string, number>();
      for (const s of suppressed) counts.set(s.deviation, (counts.get(s.deviation) ?? 0) + 1);
      out.push(`  Suppressed by Deviations: ${[...counts].map(([id, n]) => `${id} ×${n}`).join(', ')}`);
    }
    out.push('');
  }
  const all = comparisons.flatMap((c) => c.gaps);
  out.push(
    `Total: ${summary(
      all,
      comparisons.reduce((n, c) => n + c.suppressed.length, 0)
    )}`,
    ''
  );
  return out.join('\n');
}
