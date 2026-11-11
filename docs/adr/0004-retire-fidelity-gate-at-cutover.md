# Retire the Fidelity gate at Cutover

The Fidelity gate, its Baseline and the Deviation list exist to prove the Build matches the Reference site before Cutover. After Cutover the Build is the only site, and the planned work (the Hero piece, Animated UI) departs from the Reference on purpose. So all three retire at Cutover rather than staying on as a regression check with a Deviation logged for every redesign.

## Considered options

- **Keep the gate and approve a Deviation per redesigned Section.** Rejected: it keeps protecting the Sections nobody touched, but every new piece of work becomes bookkeeping against a site that no longer exists.
- **Keep the gate but drop redesigned Sections from it.** Rejected for the same reason, with less of a written record.

## Consequences

- After Cutover the parity scripts, the Reference snapshot and the unattended loop's gate step can be removed. Until then they stay as they are.
- Nothing replaces the gate as an automatic regression check; review and tests carry that.
