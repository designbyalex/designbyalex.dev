// PR body for the AFK loop's draft PR. docs/afk/NOTES.md grows past GitHub's 65,536-character body limit
// over a run (195 KB after #53–#66), so the body links to the notes and quotes only what the owner acts
// on: the `## Proposed deviations` section and the last `## Final pass` section. Sections that don't
// fit under BODY_LIMIT are cut at a line, with a note pointing to the full notes.
//
//   node scripts/afk/pr-body.ts <notes-url> <ticket>... <docs/afk/NOTES.md
//
// Prints the body. Runs on Node's built-in type stripping (Node 22.18+).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Under GitHub's 65,536, with room to spare. */
export const BODY_LIMIT = 60_000;

const INTRO = "Unattended build of the migration tickets. **Draft until visually QA'd**: see the Visual QA checklist under Final pass below.";
const ATTRIBUTION = '🤖 Generated with [Claude Code](https://claude.com/claude-code)';

export type PrBodyInput = {
  /** Tickets finished this run, in run order. */
  tickets: number[];
  /** The contents of docs/afk/NOTES.md. */
  notes: string;
  /** Where the full notes are on the branch. */
  notesUrl: string;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The last `## <heading>` section of the notes (the heading may go on, as in "Final pass (#53–#66)"),
 * up to the next `## ` heading, with its `###` subsections. Undefined when there is none.
 */
export function noteSection(notes: string, heading: string): string | undefined {
  const lines = notes.split('\n');
  const isHeading = new RegExp(`^## ${escapeRegExp(heading)}(?:[ (].*)?$`);
  const start = lines.findLastIndex((line) => isHeading.test(line));
  if (start === -1) return undefined;
  const next = lines.findIndex((line, i) => i > start && line.startsWith('## '));
  return lines
    .slice(start, next === -1 ? undefined : next)
    .join('\n')
    .trimEnd();
}

export function buildPrBody({ tickets, notes, notesUrl }: PrBodyInput): string {
  const head = [
    INTRO,
    tickets.map((n) => `Closes #${n}`).join('\n'),
    `Full run notes: [docs/afk/NOTES.md](${notesUrl}) (per-ticket builds, decisions and Verify-visually checklists).`,
  ].join('\n\n');
  const excerpt = [noteSection(notes, 'Proposed deviations'), noteSection(notes, 'Final pass')].filter((s) => s !== undefined).join('\n\n');

  const whole = [head, excerpt, ATTRIBUTION].filter(Boolean).join('\n\n');
  if (whole.length <= BODY_LIMIT) return whole;

  const note = `_Truncated to fit GitHub's limit on PR bodies: the rest is in [docs/afk/NOTES.md](${notesUrl})._`;
  const fence = '\n```';
  const budget = BODY_LIMIT - [head, note, ATTRIBUTION].join('\n\n').length - '\n\n'.length - fence.length;
  let kept = excerpt.slice(0, budget);
  kept = kept.slice(0, kept.lastIndexOf('\n')).trimEnd();
  // An odd number of fence lines means the cut fell inside a code block; close it.
  if ((kept.match(/^\s*```/gm) ?? []).length % 2 === 1) kept += fence;
  return [head, kept, note, ATTRIBUTION].join('\n\n');
}

function main() {
  const [notesUrl, ...tickets] = process.argv.slice(2);
  const notes = readFileSync(0, 'utf8');
  console.log(buildPrBody({ tickets: tickets.map(Number), notes, notesUrl }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
