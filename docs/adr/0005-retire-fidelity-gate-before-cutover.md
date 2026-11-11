# Retire the Fidelity gate now, before Cutover

ADR 0004 kept the Fidelity gate, its Baseline and the Deviation list until Cutover. On 2026-11-11 the site owner retired them early, as no longer relevant. The remaining work is owner-reviewed polish and net-new design (the light theme, the 404, Lucide icons, the Hero piece), which departs from the Reference site on purpose: #92, #93 and #110 each needed an attended Deviation PR before the loop could run them. The gate also cost run time: its Tina datalayer is pinned to port 9000, which clashes with other sessions' dev servers and failed the last unattended run twice. This supersedes ADR 0004 and ADR 0002.

## Considered options

- **Keep the gate until Cutover (ADR 0004).** Rejected: the Sections it still protects are ones the owner has already reviewed, and every new ticket became Deviation bookkeeping first.
- **Keep the comparator but drop it from the loop.** Rejected: an unused gate rots, and its Reference snapshot (a frozen Framer capture) is the only thing it could compare against.

## Consequences

- Removed: `parity/` (the Reference snapshot, gate config, Deviation list and Baseline), `scripts/parity/` and its tests, the `parity:*` scripts and Playwright, and the gate step, owner-only file list and Baseline check in the unattended loop.
- Cutover readiness is the owner's review (design, motion and content in both themes) plus a green build and tests: `scripts/afk/check.sh --full` (Tina schema and types, tsc, biome, `pnpm build-local`, vitest).
- Tickets drop their `## Parity scope` sections and Deviation steps. A ticket's acceptance criteria and the owner's review carry fidelity to Framer.
- Nothing automatic checks the Build against Framer any more. `docs/parity-audit.md` stays as the record of what Framer did.
- A few workarounds made only for the gate's extractor still render the same and are left in place (the About portrait's `clip-path` corners, #92). They can go as their tickets come up.
