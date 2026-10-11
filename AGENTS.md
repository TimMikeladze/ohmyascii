<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Studio and JSON stay in sync

Everything a piece stores is editable in the studio, and everything the studio edits is stored. The
JSON format (`*.ascii.json` pieces, worlds, modeller scenes, config, share links, AI replies) and the
studio UI are one feature surface. Never ship a change to one without the other:

- **New or changed key in the format** (`lib/ascii/config.ts`, `world.ts`, `scene.ts`): give it a
  studio control and an entry in `components/studio/coverage.ts`, whose types make this exhaustive
  (`pnpm typecheck` fails until you do). Make it parse (`parseWorld` / `parseScene` /
  `sanitizeConfig`), serialise, and document it in `skills/ohmyascii-studio/SKILL.md` and the
  relevant `docs/`.
- **New studio control**: it must edit a stored key. No UI-only state that a reload, share link,
  piece file, terminal or MCP render would lose.
- **Ranges agree**: a parser clamp must never be tighter than what the studio, the gallery or the
  AI prompt can produce. Gallery worlds must survive `parseWorld(serializeWorld(w))` unchanged.
- The JSON boxes in the studio (object, layer, camera, scene, model, settings) are live and two-way.
  They go through the same parsers, so they cover new keys automatically once those parse.
- `components/studio/coverage.test.ts` checks every label exists and every gallery world round-trips.
  Keep it green; don't weaken it to pass.
