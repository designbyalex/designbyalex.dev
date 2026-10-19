// Ticket guard (#47): decides whether the AFK loop may run a ticket, or skips it with reasons.
//
// The decision is a pure function of the issue body, its labels, the known issue states and
// the tickets finished earlier in this run (`afk(#N):` commits on the branch). The loop calls it
// as a CLI with that input as JSON on stdin:
//
//   echo '{"body":"…","labels":["ready-for-agent"],"issueStates":{"53":"OPEN"},"finished":[53]}' \
//     | node scripts/afk/ticket-guard.ts
//
// Exit 0 = run (no output). Exit 10 = skip, with the reasons on stdout joined by "; ".
// Anything else is a crash. Runs on Node's built-in type stripping (Node 22.18+).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const READY_LABEL = 'ready-for-agent';
export const SKIP_EXIT = 10;

export type GuardInput = {
  body: string;
  labels: string[];
  /** Issue number → GitHub state ("OPEN" | "CLOSED"). A blocker missing here counts as open. */
  issueStates: Record<number, string>;
  /** Tickets with an `afk(#N):` commit on the branch, finished earlier in this run. */
  finished: number[];
};

export type GuardDecision = { run: true } | { run: false; reasons: string[] };

const HITL_MARKER = /\*\*Type:\s*HITL\b/;

/** Issue numbers referenced in the body's `## Blocked by` section, in order. */
export function parseBlockedBy(body: string): number[] {
  const section = body.match(/^##\s+Blocked by[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m);
  if (!section) return [];
  return [...section[1].matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
}

export function guardTicket({ body, labels, issueStates, finished }: GuardInput): GuardDecision {
  const reasons: string[] = [];

  if (HITL_MARKER.test(body)) reasons.push('HITL ticket (body says **Type: HITL**)');
  if (!labels.includes(READY_LABEL)) reasons.push(`missing the ${READY_LABEL} label`);

  const outstanding = parseBlockedBy(body).filter((n) => issueStates[n] !== 'CLOSED' && !finished.includes(n));
  if (outstanding.length > 0) {
    reasons.push(`blocked by ${outstanding.map((n) => `#${n}`).join(', ')} (open, not finished this run)`);
  }

  return reasons.length > 0 ? { run: false, reasons } : { run: true };
}

function main() {
  const input: GuardInput = JSON.parse(readFileSync(0, 'utf8'));
  const decision = guardTicket(input);
  if (!decision.run) {
    console.log(decision.reasons.join('; '));
    process.exit(SKIP_EXIT);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
