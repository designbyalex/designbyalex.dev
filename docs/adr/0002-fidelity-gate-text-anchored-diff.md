# Fidelity gate: text-anchored diff against a frozen Reference snapshot

The first unattended loop gated each ticket on tsc, Tina schema and biome only, and left visual checks to a final pass with no browser. Nothing compared the Build with the Reference site, so it drifted while every gate stayed green. Unattended tickets are now gated on a **Fidelity gate**. Playwright renders the Build (dark theme, reduced motion, at 390 / 768 / 1440) and matches its text runs to a committed **Reference snapshot** of the Framer site by their verbatim text. It then fails on differences in geometry and computed style, and on reference text the Build lacks. A prototype (branch `prototype/fidelity-gate`) found real Gaps this way with no false positives on `/` and `/acacia`.

## Considered options

- **Screenshot pairs judged by the agent.** Rejected as the gate, because the agent marks its own homework. The pairs are still produced, for the agent's self-review and the owner's sign-off.
- **Pixel diff.** Rejected: font rendering and image decoding differ between Framer and Next, so the noise would bury the signal.
- **Comparing against Framer live.** Rejected: after Cutover the domain serves the Build, so the Reference must be frozen while Framer is still up.

## Consequences

- The gate is scoped and ratcheted. A ticket names its Sections and must clear every Gap in them that isn't on the Deviation list. Elsewhere the per-Section Baseline may only go down. A zero-flag sitewide gate would fail every ticket.
- Only the site owner edits the Deviation list. The loop fails any unattended run whose commit touches it, so an agent can't deviate its way to green.
- The gate can't judge Motion, which is left to the owner's Parity sign-off.
- The gate runs in the loop against a local production build, not in CI.
