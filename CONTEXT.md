# designbyalex.dev migration

The move of Alexander Blum's portfolio from Framer to TinaCMS + Next.js on Vercel, and the bar the new site must clear before the domain moves.

## Sites

**Reference site**:
The Framer-hosted portfolio at designbyalex.dev until cutover; the source of truth for what "faithful" means.
_Avoid_: old site, live site, Framer site (after cutover "live" is ambiguous)

**Build**:
The TinaCMS + Next.js site, deployed on Vercel.
_Avoid_: new site, migrated site, prod

**Cutover**:
The moment the domain's DNS moves from the Reference site to the Build, after which Framer is cancelled.
_Avoid_: launch, go-live, rerouting

## Parity

**Parity**:
The bar the Build must clear before Cutover, set per dimension: Copy verbatim, Media the same, Layout and Type matching the Reference site within tolerance, Motion meeting or beating it.
_Avoid_: fidelity (as a goal), "meets or beats" (as the whole bar)

**Dimension**:
One axis of Parity: Copy, Media, Layout, Type or Motion. Each has its own bar and its own judge.

**Gap**:
A place where the Build falls short of Parity on some Dimension.
_Avoid_: bug, defect, drift

**Deviation**:
A known difference from the Reference site that the site owner has approved; it no longer counts as a Gap. An agent can propose a Deviation but never approve one.
_Avoid_: accepted difference, design call

**Blocking gap**:
A Gap that must be closed (or turned into a Deviation) before Cutover.
_Avoid_: must-fix, P0

**Section**:
One visually distinct region of a page (a homepage block, a case-study header), the unit in which the Build is compared with the Reference site.

**Checkpoint width**:
One of the fixed viewport widths (390, 768, 1440) at which Layout and Type are compared.
_Avoid_: breakpoint (those belong to the CSS)

## Themes

**Faithful theme**:
The dark theme, which reproduces the Reference site and is held to Parity.

**Net-new theme**:
The light theme, which has no Reference to match; before Cutover it only has to pass contrast, mirror the Faithful theme's layout and not look broken.
_Avoid_: light mode (as a design target)

## Unattended work

**AFK ticket**:
A ticket an unattended agent may pick up and finish without a human.

**HITL ticket**:
A ticket that needs the site owner (accounts, secrets, judgement), which an unattended loop must never pick up.
_Avoid_: manual ticket

**Fidelity gate**:
The check an unattended agent runs itself to see whether its change moved a Section towards Parity, comparing the Build with the Reference site.
_Avoid_: visual QA (that is the human review)
