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
The bar the Build must clear before Cutover, judged by the site owner's review and set per dimension: Copy verbatim, Media the same, Layout and Type matching the Reference site closely, Motion meeting or beating it.
_Avoid_: fidelity (as a goal), "meets or beats" (as the whole bar)

**Dimension**:
One axis of Parity: Copy, Media, Layout, Type or Motion. Each has its own bar.

**Section**:
One visually distinct region of a page (a homepage block, a case-study header), the unit in which the Build is compared with the Reference site.

**Checkpoint width**:
One of the fixed viewport widths (390, 768, 1440) at which Layout and Type are compared.
_Avoid_: breakpoint (those belong to the CSS)

**Parity sign-off**:
The site owner's final review of design, Motion and content in both themes, alongside a green build and tests; the last step before Cutover.
_Avoid_: QA pass, parity review

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

## Brand motion

Work that starts after Cutover and departs from the Reference site on purpose.

**Brand mark**:
Alex's logo: an A built from three rounded triangles.
_Avoid_: logo mark, hero mark, the A

**Hero piece**:
The animated 3D Brand mark above the fold on the homepage, made in Blender; the pilot for the Blender workflow.
_Avoid_: hero (that is the block), hero animation, brand moment

**Animated UI**:
Product UI from a case study rebuilt as live, animated components in the page, in place of a screenshot in a device frame.
_Avoid_: Jitter animation, UI video, mockup

## Retired terms

The Fidelity gate and its vocabulary were removed on 2026-11-11, before Cutover (ADR 0005). They survive only in history: older ADRs, `docs/afk/NOTES.md` and closed tickets.

- **Fidelity gate**: the automatic check that compared the Build with a frozen **Reference snapshot** of the Reference site, per Section and Checkpoint width.
- **Gap**: one difference it found. **Blocking gap**: one that had to close before Cutover.
- **Baseline**: the committed Gap counts, which could only go down.
- **Deviation** / **Deviation list**: an owner-approved difference that stopped counting as a Gap, and the file that held them.
- **Parity scope**: a ticket's list of Sections whose Gaps had to reach 0.
