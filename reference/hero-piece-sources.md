# Hero piece sources

The hero piece is the animated 3D Brand mark above the fold on the homepage, made in Blender (`CONTEXT.md`). It is its own lane (see `docs/agents/orchestration.md` → Lanes).

| What | Where | Verified |
|---|---|---|
| Logo source files (letter SVGs and PNGs, wordmarks, favicons, social preview) | `~/Freelance/Portfolio/site/logo/` | 2026-11-11: `ls` shows `a.svg`, `e.svg`, `l.svg`, `x.svg`, their PNGs, `logo-alex-wordmark-triangles.svg`, `favicon-dark.svg` and more; no scene scripts or `.blend` files there |
| Other hero material (looks, motion, type tests) | `~/Freelance/Portfolio/site/hero-piece/` | 2026-11-11: `ls` shows `h1-test`, `looks`, `motion` |
| Scene script | `hero-piece/build_scene.py` on the `prototype/hero-piece` branch; it reads `hero-piece/a.svg` and writes renders to `hero-piece/out/<shot>.png` | 2026-11-11: `git ls-tree prototype/hero-piece` and the script's `OUT_DIR = HERE / "out"` |
| Review build of the frames | `components/hero-piece/` and `public/hero-piece/` (frames a, b, b-portrait, c, still) on `prototype/hero-piece` | 2026-11-11: `git ls-tree prototype/hero-piece` |
| Prototype branch | `prototype/hero-piece`, local only (not on `origin`), tip 384ba4b, 2026-11-11 15:24 +1100 | 2026-11-11: `git log -1 prototype/hero-piece`; `git ls-remote --heads origin` doesn't list it |
| `.blend` backups | `~/Freelance/Portfolio/hero-piece-scene-out-backup/`: `hero-piece.blend`, `hero-piece.blend1`, `still.png`, `viewport.png`, `run.log` | 2026-11-11: `ls -la`, latest files 14:01 |

Rules:

- `prototype/hero-piece` never merges.
- Keep `.blend` files that may hold Alex's hand edits outside any worktree that might be cleaned up, for example in the backup folder above.
- The scene scripts rebuild every render; at checkpoints, load the scene into Alex's Blender for his direction and write his hand edits back into the script.
- Hero worktrees on 2026-11-11 (`git worktree list`): `hero-piece-frames-a017aa`, `hero-piece-frames-preview-667242`, `hero-piece-preview-72cd1d`, `hero-piece-scene-ec2cde`, all under `repo/.claude/worktrees/`. These change often; check `git worktree list` rather than trusting this line.
