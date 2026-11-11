import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BODY_LIMIT, buildPrBody, noteSection } from './pr-body';

const url = 'https://github.com/designbyalex/designbyalex.dev/blob/afk/migration/docs/afk/NOTES.md';
const attribution = '🤖 Generated with [Claude Code](https://claude.com/claude-code)';

const notes = `# AFK run notes

Written by the unattended loop.

## #9 S5: Migrate Acacia case study

Old ticket notes.

## Final pass

Old run's final pass.

## #53 P6: Inter + typography token ramp

Ticket notes.

## Open questions

- **Hero copy.** Suggested wording.

## Final pass (#53–#66)

### What failed, and how it was fixed

Nothing.

### Visual QA checklist (consolidated, #53–#66)

- [ ] Header at 390
`;

describe('noteSection', () => {
  it('returns a section from its heading up to the next ## heading, keeping its ### subsections', () => {
    expect(noteSection(notes, 'Open questions')).toBe('## Open questions\n\n- **Hero copy.** Suggested wording.');
  });

  it('takes the last section with the heading, which runs to the end of the notes', () => {
    expect(noteSection(notes, 'Final pass')).toBe(
      '## Final pass (#53–#66)\n\n### What failed, and how it was fixed\n\nNothing.\n\n' +
        '### Visual QA checklist (consolidated, #53–#66)\n\n- [ ] Header at 390'
    );
  });

  it('returns undefined when there is no such section', () => {
    expect(noteSection('# AFK run notes\n\n## #53 P6\n\nNotes.\n', 'Final pass')).toBeUndefined();
  });
});

describe('buildPrBody', () => {
  it('is the intro, the Closes lines, the notes link, the last Final pass and the attribution, in that order', () => {
    const body = buildPrBody({ tickets: [53, 55], notes, notesUrl: url });
    expect(body).toBe(
      [
        "Unattended build of the migration tickets. **Draft until visually QA'd**: see the Visual QA checklist under Final pass below.",
        '',
        'Closes #53',
        'Closes #55',
        '',
        `Full run notes: [docs/afk/NOTES.md](${url}) (per-ticket builds, decisions and Verify-visually checklists).`,
        '',
        '## Final pass (#53–#66)',
        '',
        '### What failed, and how it was fixed',
        '',
        'Nothing.',
        '',
        '### Visual QA checklist (consolidated, #53–#66)',
        '',
        '- [ ] Header at 390',
        '',
        attribution,
      ].join('\n')
    );
  });

  it('quotes no other section', () => {
    const body = buildPrBody({ tickets: [53], notes, notesUrl: url });
    expect(body).not.toContain('Open questions');
    expect(body).not.toContain("Old run's final pass");
  });

  it('is the head and the attribution when the notes have no Final pass', () => {
    const body = buildPrBody({ tickets: [53], notes: '# AFK run notes\n\n## #53 P6\n\nNotes.\n', notesUrl: url });
    expect(body).not.toContain('## ');
    expect(body.endsWith(`checklists).\n\n${attribution}`)).toBe(true);
  });

  it('keeps a body under the limit whole', () => {
    expect(buildPrBody({ tickets: [53], notes, notesUrl: url })).not.toContain('truncated');
  });

  it('truncates the sections at a line to fit the limit, with a note, and keeps the Closes lines and attribution', () => {
    const long = Array.from({ length: 4000 }, (_, i) => `- [ ] check ${i}: ${'x'.repeat(40)}`).join('\n');
    const body = buildPrBody({
      tickets: [53, 55, 66],
      notes: `## Final pass (#53–#66)\n\n${long}\n`,
      notesUrl: url,
    });

    expect(body.length).toBeLessThanOrEqual(BODY_LIMIT);
    expect(body).toContain('Closes #53\nCloses #55\nCloses #66');
    expect(body).toMatch(/- \[ \] check \d+: x{40}\n\n_Truncated to fit GitHub's limit/);
    expect(body).toContain(`the rest is in [docs/afk/NOTES.md](${url})._`);
    expect(body.endsWith(attribution)).toBe(true);
  });

  it('closes a code fence the cut leaves open', () => {
    const fenced = `\`\`\`\n${'line\n'.repeat(20_000)}\`\`\``;
    const body = buildPrBody({ tickets: [53], notes: `## Final pass\n\n${fenced}\n`, notesUrl: url });
    expect(body.length).toBeLessThanOrEqual(BODY_LIMIT);
    expect(body).toMatch(/line\n```\n\n_Truncated/);
  });
});

describe('CLI', () => {
  it('reads the notes on stdin and takes the notes URL and tickets as arguments', () => {
    const r = spawnSync('node', ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', join(__dirname, 'pr-body.ts'), url, '53', '55'], {
      input: notes,
      encoding: 'utf8',
    });
    expect(r.stderr).toBe('');
    expect(r.status).toBe(0);
    expect(r.stdout).toBe(`${buildPrBody({ tickets: [53, 55], notes, notesUrl: url })}\n`);
  });
});
