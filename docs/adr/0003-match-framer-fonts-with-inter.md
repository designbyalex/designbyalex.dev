# Match the Reference site's fonts with Inter, not Inter Tight

The S0 design audit (`docs/design-audit.md`) read Framer's font files as Inter Tight, so the Build set everything in Inter Tight. The parity audit measured the rendered glyphs and found that Framer serves real **Inter** for body and UI, and **Inter Display** for display and headings. Live body copy is about 12% wider than the Build's. We switch to Inter (OFL, Google Fonts, self-hosted through `next/font`), using its optical-size axis for the display cut, and keep Space Mono for labels. This replaces S0's typeface decision; the rest of S0 stands.

## Considered options

- **Keep Inter Tight and approve it as a Deviation.** Rejected: Type is held to Parity, and the narrower set changes line breaks and measure on every page.
