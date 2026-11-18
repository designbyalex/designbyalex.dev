# Theme pour grill

Status: done
PBI: #169
Started: 2026-11-18
Picker page: [Portfolio Theme Pour Picks](https://claude.ai/artifact/375RtcruAzeMKkZf3AmEgW)

## Already decided

- Portfolio Refinement Picks, round 2, Goo mask: Pours down (drip, reversed), with "the same 3d effect" as the home page.
- Portfolio Home Drip Picks: Coalesce, mixed blobs and droplets, gloss edge, page colour. The Drip tuner preset of 2026-11-13 holds the numbers.
- Portfolio Hero Glass Picks, the material brief: "apple liquid glass", "blurry warped distorted background through the glass material", "like water made solid", and it would "slowly collapse and ooze".
- Issue #169: reduced motion, no WebGL2 or a shader error swap the theme instantly, and nothing idles after a switch.

## Round 1

Scope comes first, because the options on the picker page depend on it.

### Q1 · chat · What the goo borrows from the home page

- **Recommended:** A, drip and glass: the home drip's blobs, droplets, stretch and gloss, with the Hero piece's clear glass look on the edge.
- **Answer:** A, drip and glass, recommended.
- **Pattern:** The theme pour's goo is the home drip's blobs, droplets, stretch and gloss, with the Hero piece's clear glass look on its edge.

### Q2 · chat · How far the goo reaches

- **Recommended:** A, the theme switch only.
- **Answer:** B, a reusable goo recipe, not recommended.
- **Pattern:** The goo ships on the theme switch first, defined as a shared recipe that other transitions can adopt later.

### Q3 · chat · PR #213 during the grill

- **Recommended:** A, hold the PR and build the winning design on it.
- **Answer:** A, hold it, recommended.
- **Pattern:** PR #213 stays unmerged until the grill's picks are built on it.

## Round 2

All five questions are on the picker page, live on the real Acacia and home pages at 1440 and 390.

### Q4 · page · Edge material

- **Recommended:** Clear glass rim
- **Pick:** Now: glossy lip, not recommended.
- **Pattern:** The pour's edge is the home drip's glossy lip. This replaces the clear glass look from Q1, so glass tint and bent glass are dropped.

### Q5 · page · Blobs at the edge

- **Recommended:** Further ahead, like the home drip
- **Pick:** Further ahead, like the home drip, recommended.
- **Pattern:** Blobs lead the sheet by up to 30% of the viewport height, easing back by 20% over the pour.

### Q6 · page · Droplets

- **Recommended:** A few falling ahead
- **Pick:** A few falling ahead, recommended.
- **Pattern:** Five droplets fall ahead of the blobs and merge into the sheet as it catches them.

### Q7 · page · Pour speed

- **Recommended:** Now: 1.1s, fast then easing
- **Pick:** Now: 1.1s, fast then easing, recommended.
- **Pattern:** The pour runs 1.1 s on a cubic ease-out.

### Q8 · page · Start at the toggle

- **Recommended:** A drop swells, then lets go
- **Pick:** Now: blooms as the sheet pours, not recommended.
- **Pattern:** The bloom swells at the toggle while the sheet pours, with no pause before it.

## Round 3

### Q9 · page · Sign-off on each screen

- **Recommended:** Signed off on all three frames: case study dark to light, case study light to dark, and home dark to light.
- **Pick:** Needs changes on case study dark to light ("only the edge is visible - the fill is transparent") and on home dark to light. Case study light to dark was left unpicked. Reopened in round 4.
- **Pattern:** The goo has a solid fill in the new page colour, not only a visible edge.

## Round 4

### Q10 · page · Goo fill

- **Recommended:** Solid goo, page melts in behind
- **Pick:** None. Alex rejected the direction: "i dont like it - can we keep it simple for this first iteration", "go back to the simple more 2d animation options".
- **Pattern:** The first version of the theme switch is a simple flat 2D animation, with no gloss, 3D edge or shader.

### Q11 · page · Sign-off on each screen

- **Recommended:** Signed off on all three frames, with the picked fill applied.
- **Pick:** None. Withdrawn with Q10.
- **Pattern:** The glossy goo picks in rounds 1 to 4 and the shared goo recipe are parked for a later version.

## Round 5

### Q12 · page · Theme switch

- **Recommended:** Pours down (drip, reversed), flat, as first picked on Portfolio Refinement Picks.
- **Pick:** Boiling circle, not recommended.
- **Pattern:** The theme switch opens the new theme from the toggle in a flat 0.9 s circle with a bubbling edge.

## Decided

- The theme switch opens the new theme from the toggle in a flat 0.9 s circle with a bubbling edge.
- The first version has no gloss, 3D edge, shader or canvas.
- Reduced motion, or a browser without View Transitions, swaps the theme instantly.
- A click on the toggle mid-switch lets the circle finish, then switches back. Another click cancels that.
- The home hero drip stays exactly as it is on `main`.
- Parked for a later version: the glossy goo from rounds 1 to 4 and the shared goo recipe.

### Glossary

- **Boiling circle**: the theme switch's flat circle that opens from the toggle with a bubbling edge. Avoid: theme pour, goo pour.
