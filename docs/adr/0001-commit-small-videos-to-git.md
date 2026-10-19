# Commit small case-study videos to git

PRD #3 said video is never committed and is always embedded from an external host. The only videos on the site are the three MOS Urban loops, 3.4 MB in total (less than the homepage share image), and they streamed from `framerusercontent.com`, which disappears at Cutover. We commit them under `public/uploads/projects/mosurban/` and serve them from Vercel's CDN as muted autoplay loops (never autoplaying under reduced motion), rather than adding Vercel Blob or a video host.

## Consequences

- The threshold is per file: any single video over 10 MB, or a repo `public/uploads` total over ~50 MB, goes to an external host instead. Revisit this ADR then.
- The `video` block needs to play local `/uploads/...` files as well as external URLs.
