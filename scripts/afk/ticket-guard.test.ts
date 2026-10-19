import { describe, expect, it } from 'vitest';
import { guardTicket, parseBlockedBy } from './ticket-guard';

const afkBody = (blockedBy: string) => `## Parent
- #46

## What to build

**Type: AFK.**

Build the thing.

## Acceptance criteria

- [ ] It works (see #3 for context)

## Blocked by

${blockedBy}
`;

const ready = ['ready-for-agent'];

describe('parseBlockedBy', () => {
  it('reads every issue reference in the Blocked by section', () => {
    expect(parseBlockedBy(afkBody('- #12\n- #13'))).toEqual([12, 13]);
  });

  it('returns none for "None - can start immediately"', () => {
    expect(parseBlockedBy(afkBody('None - can start immediately'))).toEqual([]);
  });

  it('ignores references outside the section', () => {
    const body = `${afkBody('- #51')}\n## Notes\n\nSee #99.\n`;
    expect(parseBlockedBy(body)).toEqual([51]);
  });

  it('returns none when there is no Blocked by section', () => {
    expect(parseBlockedBy('## What to build\n\nFixes #4.')).toEqual([]);
  });
});

describe('guardTicket', () => {
  it('runs a ready AFK ticket whose blockers are closed', () => {
    expect(guardTicket({ body: afkBody('- #51'), labels: ready, issueStates: { 51: 'CLOSED' }, finished: [] })).toEqual({ run: true });
  });

  it('runs a ready AFK ticket with no blockers', () => {
    expect(guardTicket({ body: afkBody('None - can start immediately'), labels: ready, issueStates: {}, finished: [] })).toEqual({ run: true });
  });

  it('skips a HITL ticket by its body marker, with or without a trailing period', () => {
    for (const marker of ['**Type: HITL**', '**Type: HITL.**', '**Type: HITL** (accounts/secrets)']) {
      const body = afkBody('None').replace('**Type: AFK.**', marker);
      expect(guardTicket({ body, labels: ready, issueStates: {}, finished: [] })).toEqual({
        run: false,
        reasons: ['HITL ticket (body says **Type: HITL**)'],
      });
    }
  });

  it('skips a ticket without the ready-for-agent label', () => {
    expect(guardTicket({ body: afkBody('None'), labels: ['post-cutover'], issueStates: {}, finished: [] })).toEqual({
      run: false,
      reasons: ['missing the ready-for-agent label'],
    });
  });

  it('skips a ticket whose blocker is open and not finished this run', () => {
    expect(guardTicket({ body: afkBody('- #51\n- #53'), labels: ready, issueStates: { 51: 'CLOSED', 53: 'OPEN' }, finished: [] })).toEqual({
      run: false,
      reasons: ['blocked by #53 (open, not finished this run)'],
    });
  });

  it('treats a blocker with no known state as open', () => {
    expect(guardTicket({ body: afkBody('- #53'), labels: ready, issueStates: {}, finished: [] })).toEqual({
      run: false,
      reasons: ['blocked by #53 (open, not finished this run)'],
    });
  });

  it('runs when the open blockers were finished earlier in the same run', () => {
    expect(guardTicket({ body: afkBody('- #53\n- #54'), labels: ready, issueStates: { 53: 'OPEN', 54: 'OPEN' }, finished: [53, 54] })).toEqual({
      run: true,
    });
  });

  it('names only the blockers still outstanding', () => {
    expect(guardTicket({ body: afkBody('- #53\n- #54\n- #55'), labels: ready, issueStates: { 53: 'OPEN', 54: 'OPEN', 55: 'OPEN' }, finished: [54] })).toEqual({
      run: false,
      reasons: ['blocked by #53, #55 (open, not finished this run)'],
    });
  });

  // AFK_TICKETS="14 15": both are HITL, neither carries ready-for-agent, and #15 waits on #14.
  describe('the AFK_TICKETS="14 15" dry run', () => {
    const issueStates = { 12: 'CLOSED', 13: 'CLOSED', 14: 'OPEN', 47: 'OPEN' };
    const ticket14 = '## Parent\n- #3\n\n## What to build\n\n**Type: HITL** (accounts/secrets + verification required).\n\n## Blocked by\n\n- #12\n- #13\n';
    const ticket15 = '## Parent\n- #3\n\n## What to build\n\n**Type: HITL.** Final go-live gate.\n\n## Blocked by\n\n- #14\n- #47\n';

    it('skips #14 as HITL', () => {
      expect(guardTicket({ body: ticket14, labels: [], issueStates, finished: [] })).toEqual({
        run: false,
        reasons: ['HITL ticket (body says **Type: HITL**)', 'missing the ready-for-agent label'],
      });
    });

    it('skips #15 as HITL and blocked by #14, since the skipped #14 was not finished', () => {
      expect(guardTicket({ body: ticket15, labels: [], issueStates, finished: [] })).toEqual({
        run: false,
        reasons: ['HITL ticket (body says **Type: HITL**)', 'missing the ready-for-agent label', 'blocked by #14, #47 (open, not finished this run)'],
      });
    });
  });
});
