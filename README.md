# ohmyascii

Turn any photo, SVG, logo or text — a 3D shape you model, sculpt and paint yourself, or a whole animated 2D / 3D scene you compose (or describe to an AI) — into a rotatable, animated ASCII render. The home page is a chat: describe a scene and watch it render live, then continue in the studio. Ships as a studio app and as shadcn registry items.

## Run

```bash
bun install
bun run dev            # binds 127.0.0.1; pass -p <port> if 3000 is taken (bun run dev:lan to reach it from other devices)
bun run test           # vitest: modelling, worlds (animation, geometry, fields, renderer), AI reply parsing
```

## The site

- **`/`** — a chat-first landing. The composer is a launcher: describe a scene and the studio opens with the AI art director already building it; keep chatting there to refine it ("make it snow").
- **Gallery** — under the home composer, 36 tuned scenes, the 7 built-in marks and type examples each render as a live card; clicking one opens the studio on it.
- **`/studio`** — the full studio (everything below), where the AI chat lives. The side panel starts with four tabs — **Image · Text · Model · Scene** — and shows only that mode's controls; Look, Light, Motion and Effects follow, with rarely used settings under each section's collapsed *More* group. Deep links: `/studio?q=<prompt>` starts a fresh AI scene, `/studio#w=<preset key>` (e.g. `#w=orrery`) opens a gallery creation, `/studio#z=…` share links (compressed; older `#s=…` links still open) restore config + source + world. A link is applied on top of your saved session — one ⌘Z goes back — and then removed from the address bar, so reloading keeps your latest work.

AI scene generation (optional) has two engines:

- **Claude Code (local)** — when the studio runs on localhost and `claude` is installed and logged in, the chat uses your own Claude Code (`claude -p`, no API key, tools disabled), keeping one Claude session per chat. `OHMYASCII_CLAUDE_MODEL` picks a model. Never available on a deployed site, and refused for non-loopback clients (`bun run dev` binds 127.0.0.1).
- **AI Gateway** — set `AI_GATEWAY_API_KEY`, or run `vercel env pull .env.local` in a linked project to get an OIDC token. `OHMYASCII_AI_MODEL` overrides the model (default `anthropic/claude-sonnet-5.5`). `/api/generate` validates requests, rejects cross-site browsers, caps prompt size and rate-limits each IP (`OHMYASCII_AI_RATE_LIMIT`, default 20 per 10 minutes per server instance). On a public deployment also add a Vercel Firewall rate-limit rule and an AI Gateway budget.

## Install with the shadcn CLI

The registry is served from `public/r/` by this app (rebuilt on every `bun run build`, or `bun run registry:build`).

```bash
# Just the component (components/ohmyascii.tsx + lib/ascii/*)
npx shadcn@latest add https://ohmyascii.vercel.app/r/ohmyascii.json

# Full editor (component + studio UI + presets)
npx shadcn@latest add https://ohmyascii.vercel.app/r/ohmyascii-studio.json
```

Locally: `http://localhost:<port>/r/ohmyascii.json`.

Items are defined in `registry.json`. Fonts are read from the CSS variables `--font-geist-mono`, `--font-jetbrains`, `--font-space`, `--font-plex`; missing variables fall back to the system monospace font.

## Use

```tsx
import { OhMyAscii } from '@/components/ohmyascii'

<OhMyAscii
  source="/logo.svg"
  config={{ shape: 'extrude', thickness: 0.4, charset: ' .:-=+*#%@' }}
  className="h-[640px] w-full"
/>
```

`source` is a URL, `{ kind: 'text', text, fontKey, weight }`, `{ kind: 'scene', scene }` with a scene exported from the studio's modeller, or `{ kind: 'world', world }` with a composed world (see below). Drag rotates 360°, pinch zooms on touch and trackpad, arrow keys rotate the focused canvas (`+`/`-` zoom, `0` resets), `wheelZoom` enables scroll zoom, double-click resets. All config keys live in `lib/ascii/config.ts`; the studio's "Copy code" button emits only the keys you changed.

## Model, sculpt & paint

The **Model** tab switches the canvas to a scene you build yourself.

- **Shapes** — add sphere / box / cylinder / torus / cone, then move, rotate, scale and colour the selected one. Shapes melt into one surface (**Blend between shapes**); set a shape to **Cut away** to carve it out of the others.
- **Canvas tools** — `o` orbit · `v` select (click a shape) · `b` paint · `g` clay (build up) · `e` carve. `[` / `]` resize the brush, alt-drag orbits while a brush is active, `d` / `⌫` duplicate / delete the selected shape. Each stroke is one undo step.
- **Paint** shows in Look → Colour → Image (switched on automatically when you pick the brush).
- **Import** OBJ or STL (up to 250k triangles); it becomes a shape you can transform and paint. Scene JSON files load back in the same way.
- **Export** — Scene JSON (everything, including paint and imported meshes) and a PLY point cloud for Blender / MeshLab. Share links carry shapes and sculpting; paint and imported meshes stay local.

Use an exported scene in your own app:

```tsx
import { OhMyAscii } from '@/components/ohmyascii'
import type { SerializedScene } from '@/lib/ascii/scene'
import scene from './scene.json'

<OhMyAscii source={{ kind: 'scene', scene: scene as SerializedScene }} className="h-[640px] w-full" />
```

How it works: every shape and sculpt dab is a signed distance function; the scene samples each shape's surface, keeps samples on the blended surface and projects them onto it (`lib/ascii/scene.ts`). Strokes and shape tweaks only resample the region that changed. Details in `docs/mesh-editor.md`.

## Compose worlds — whole animated 2D / 3D scenes

The **Scene** tab switches to a *world*: many objects, each with its own geometry, colours, glyphs and animation, over generative backgrounds, seen through an animated camera.

- **Gallery** — pick from the dropdown (or step with ‹ ›) — 36 tuned scenes to start from: Orrery, Ocean sunset, Koi pond (2D), Aurora peaks, Galaxy, Double helix, Campfire, Warp tunnel, Zen garden, Neon rain, Lotus mandala (2D), Jellyfish, Synthwave, Lighthouse storm, Black hole, Firefly grove, Winter village, Earthrise, Balloon dawn, Glyph rain, Volcano, Ringed giant, Atom, Lava lamp, Desert night, Snow summit, Torus knot, Heartbeat, Eclipse, Windmill, Crystal cave, Coral reef, Tornado, Jack-o’-lantern, Liftoff, Close encounter.
- **Objects** — solids, 2D shapes (circle, ring, star, polygon, heart, moon, petal…, with pillow bevels), text, images, tubes along curves (helix, knot, lissajous, spiral), terrain (hills, mountains, dunes, a live ocean), particles (stars, snow, rain, fireflies, embers, galaxy, planetary ring, dust) and anything built in the modeller (**+ Modelled object**).
- **Material** — lit and shadow colour, per-object glyph ramp, self-lit amount, colour by height (sunsets, flames).
- **Animation** — spin, orbit, bob, pulse, sway, drift, keyframes, plus wave / twist deformers; stack as many as you like. **Arrays** repeat an object in rings, rows and spirals with staggered timing (`phase`) and random heights (`jitter`).
- **Backgrounds** — gradient, plasma, noise, waves, ripples, glyph rain, fire, aurora, tunnel, vortex, stars, metaballs, rings, retro grid; behind objects or in front of them.
- **Camera** — tilt / turn / roll, perspective (0 = flat 2D), zoom, pan and its own animation. Drag orbits, click an object to select it, `d` / `⌫` duplicate / delete. Video export records exactly one loop.
- **Everything is editable in the studio.** Each object, background layer and the camera has its controls plus a **JSON** box with every stored setting. Edits there are validated and applied as one undo step (⌘Enter). **Scene JSON** edits the whole world, **Settings JSON** (under Export) edits the look, and the Model tab has a JSON box for shapes and sculpt dabs. Keyframes have a real editor: time, then move / turn / scale per key. A modelled object opens in the modeller with **Edit in the modeller**; **Save to scene** writes it back, and your own modeller scene is restored.
- Worlds save to the session, share links (local images excepted), folder pieces and **Export** (`*.world.json`).

```tsx
import { OhMyAscii } from '@/components/ohmyascii'
import type { SerializedWorld } from '@/lib/ascii/world'
import world from './sunset.world.json'

<OhMyAscii source={{ kind: 'world', world: world as SerializedWorld }} className="h-[640px] w-full" />
```

### Generate with AI

The **Generate with AI** section is a chat with an art director: describe a scene ("a lighthouse on a cliff in a storm") and it streams back a world and look, applied as one undo step. Follow-ups ("make it snow", "add a second moon") edit the scene on screen. Every applied reply has a **Restore** button that puts the scene back to that turn, so the chat doubles as a version history. If the engine fails (credentials, rate limit, a reply cut off at the length limit) the chat says why. The home page's chat speaks the same protocol with the same engines. Pick **Claude Code (local)** or **AI Gateway** at the top of the section. **Copy for Claude Code in your terminal** copies a handoff prompt instead ("Use the ohmyascii-studio skill…" + the open piece or the scene JSON + your request) for an agent that edits piece files while the studio renders them — the robocn pattern, see `docs/local-claude.md`. `app/api/generate/route.ts` streams from the AI Gateway; `lib/ascii/world-prompt.ts` holds the instructions and the tolerant reply parser. Details: `docs/worlds.md`.

## Build with an agent (folder mode)

The studio can hold a folder on disk (Folder → **Open folder**, desktop Chrome / Edge, via [`use-fs`](https://use-fs.com)). Every `*.ascii.json` file in it is a *piece* — source (preset, text, image, modelled scene or world) + config as plain JSON:

```json
{ "v": 1, "source": { "kind": "text", "text": "HI" }, "config": { "charset": " .:-=+*#%@", "colorMode": "mono" } }
```

- An agent (Claude Code, etc.) writes or edits pieces; the studio renders the active one live (a new piece opens automatically).
- Your slider tweaks save back to the same file; uploads are copied into the folder so the piece can reference them (`{ "kind": "image", "path": "logo.svg" }`).
- After each change the rendered frame is written next to the piece as `<name>.frame.txt`, so the agent can read what it made and iterate.
- The folder is remembered; after a browser restart click **Reconnect**.

**MCP server** — `.mcp.json` registers `ohmyascii-studio` (`bun run mcp`) for Claude Code started in this repo: `studio_guide`, `list_gallery`, `get_gallery_piece`, `validate_piece`, `render_piece` (headless ASCII frames of any piece at chosen times, no browser), `list_pieces`, `read_piece` (with the studio's `.frame.txt`), `write_piece` (validate, normalise, save, preview). It works in `OHMYASCII_STUDIO_DIR` or the working directory; see `docs/local-claude.md` to point it at another folder.

The [ohmyascii-studio skill](skills/ohmyascii-studio/SKILL.md) teaches agents to interpret a brief, art-direct a scene, build recognizable creatures, choreograph motion, and inspect real previews. Its references cover all 36 gallery worlds, a detailed koi-pond construction study, material glyphs, palettes, the complete piece/config format, and exact loop timing. `bun install` mirrors the full skill into `.claude/skills/` and `.agents/skills/` (or run `bun run skills:sync`).

```text
# Claude Code — short command, or /ohmyascii-studio
/ascii two koi circling a lotus, ink-blue water, jade and ivory, intricate and calm

# Codex
$ohmyascii-studio Create a moonlit ASCII aquarium for an 80×24 terminal in ascii/aquarium.ascii.json
```

### Animation patterns and JSON starters

Choose a [pattern](skills/ohmyascii-studio/references/patterns.md) by its overall composition and motion. Each recipe includes customization parameters, supported construction techniques, small-terminal adjustments and visual checks. Name a pattern in your prompt or let the agent choose from your description.

The JSON starters are complete editable animation files, not prompt snippets. Copy one into your output folder and change its subject, palette, geometry and choreography. The bundled templates stay unchanged.

| Pattern / starter | Starting animation |
|---|---|
| [Hero turntable](skills/ohmyascii-studio/assets/templates/hero-turntable.ascii.json) | A rotating teal sculpture with a warm center; adapt to a model, logo or supplied image |
| [Kinetic type](skills/ohmyascii-studio/assets/templates/kinetic-type.ascii.json) | Gently rocking “FLOW” lettering |
| [Creature habitat](skills/ohmyascii-studio/assets/templates/creature-habitat.ascii.json) | Two koi circling a layered lotus on rippling water |
| [Scenic diorama](skills/ohmyascii-studio/assets/templates/scenic-diorama.ascii.json) | Desert dunes, crescent moon and cactus |
| [Radial ornament](skills/ohmyascii-studio/assets/templates/radial-ornament.ascii.json) | Counter-rotating lotus rings and a pulsing bead halo |
| [Orbital system](skills/ohmyascii-studio/assets/templates/orbital-system.ascii.json) | Moving electrons around a nucleus |
| [Particle volume](skills/ohmyascii-studio/assets/templates/particle-volume.ascii.json) | A galaxy with 1,200 seeded particles |
| [Generative field](skills/ohmyascii-studio/assets/templates/generative-field.ascii.json) | Flowing lava-lamp forms with rising particles |
| [Flight tunnel](skills/ohmyascii-studio/assets/templates/flight-tunnel.ascii.json) | Neon rings and streaks suggesting forward travel |
| [Staged action](skills/ohmyascii-studio/assets/templates/staged-action.ascii.json) | A rocket with animated exhaust; adapt with keyframes for ordered poses |

Preview a bundled starter immediately:

```bash
bun run cli skills/ohmyascii-studio/assets/templates/creature-habitat.ascii.json
```

Start your own piece (choose a new filename if the destination already exists):

```bash
mkdir -p ascii
cp -n skills/ohmyascii-studio/assets/templates/creature-habitat.ascii.json ascii/moon-pond.ascii.json
bun run cli ascii/moon-pond.ascii.json --watch
```

Edit the copied JSON yourself, or ask `/ascii` / `$ohmyascii-studio` to personalize that file. It remains editable in the studio. Templates derived from the gallery retain ambient choreography: their `duration` is a recording interval, **not a guarantee of seamless looping**. Exact loops need every moving channel checked, including the camera, fields and particles.

### Preview and validate without a browser

The bundled helper works with the checkout's installed dependencies, without MCP or an open studio:

```bash
bun run tsx skills/ohmyascii-studio/scripts/inspect.ts --list
bun run tsx skills/ohmyascii-studio/scripts/inspect.ts koi --json
bun run tsx skills/ohmyascii-studio/scripts/inspect.ts ascii/moon-pond.ascii.json --cols 80 --rows 24 --aspect 2 --times 0,3,6,9,11.95,12 --out /tmp/moon-pond-preview
```

`--list` lists gallery keys; `--json` exports a complete normalized piece. The preview command reports parser repairs, warnings and missing assets, and saves `frames.txt`, `contact-sheet.png`, and `report.json`. It never rewrites the input piece. Without `--out`, it prints the report and text frames. Run `--help` for all options.

Set dimensions to the actual delivery size; terminal cells usually need `--aspect 2`. The example samples a 12-second interval: adjust `--times` to your piece's intended duration. Compare both endpoints and adjacent frames around the seam before claiming a seamless loop. Headless previews disable intro, shimmer and grid dots, and fonts may differ from the browser; check those effects in the studio when they matter.

### Install the skill in another project

Copy the **complete** `skills/ohmyascii-studio` directory, including references, scripts, metadata and templates, into the target project's `.claude/skills/` for Claude Code or `.agents/skills/` for Codex. For Claude's short `/ascii` alias, also copy `.claude/commands/ascii.md` into the target project's `.claude/commands/`. The installed skill itself is available as `/ohmyascii-studio` in Claude Code and `$ohmyascii-studio` in Codex. The Claude command file does not add a Codex slash command.

The skill does not bundle the renderer or its Node dependencies. Use a configured ohmyascii MCP server, an installed terminal CLI, or the renderer checkout. If the helper is installed elsewhere, run it with the checkout's `bun run tsx` and pass `--repo /path/to/ohmyascii`; input and output paths still resolve from your shell's working directory. See [delivery and installation](skills/ohmyascii-studio/references/delivery.md) for details.

The source of truth stays in `skills/`; `bun run skills:sync` replaces the local `.claude/skills/` and `.agents/skills/` mirrors. Edit the source rather than a mirror. Most starters use native geometry; if you adapt one to a supplied image, deliver that asset beside the piece using its relative path.

### Skill reference guide

| Reference | Covers |
|---|---|
| [Art direction and koi study](skills/ohmyascii-studio/references/art-direction.md) | Intent, composition, anatomy, layered detail, palettes and material glyphs |
| [Patterns and starters](skills/ohmyascii-studio/references/patterns.md) | Ten animation types, adaptation recipes, pattern combinations and supported capability boundaries |
| [Gallery atlas](skills/ohmyascii-studio/references/gallery.md) | Construction techniques from all 36 curated worlds |
| [Piece and configuration format](skills/ohmyascii-studio/references/format.md) | All source kinds, geometry, behaviors, fields, configuration keys and budgets |
| [Motion and verification](skills/ohmyascii-studio/references/motion-and-verification.md) | Timing units, exact-loop conditions, seam checks and troubleshooting |
| [Delivery](skills/ohmyascii-studio/references/delivery.md) | Claude/Codex invocation, installation, assets, studio feedback and export |

See [folder mode](docs/studio-folder.md) for the studio's file feedback loop. The skill tests validate reference paths and JSON examples, render every starter at terminal size, and exercise helper exports, diagnostics, colored previews and installation outside the checkout.

## Terminal

Every studio piece plays in the terminal in full colour: gallery worlds, models, image / text / preset pieces.

```bash
bun run cli                                     # browse the gallery: ↑/↓ + enter, ←/→ scene, wasd orbit, q quit
bun run terminal:link                           # puts `ohmyascii` on your PATH
ohmyascii ./logo.ascii.json --watch          # any piece file; reloads on save
ohmyascii 'http://localhost:3000/studio#s=…' # studio → Terminal copies this command
ohmyascii bake koi --seconds 8 > koi.sh      # self-playing script (or --format cast | json | ans)
```

Embed with `openTerminalPiece(openPiece(input), { cols, rows })` from `packages/terminal` (`ohmyascii`); `frame(t)` returns ANSI lines. See `docs/terminal.md` or `ohmyascii guide`.

## Studio extras

- **Share link** (Export → Share link, or `s`) encodes the config, source and any scene / world (compressed) in the URL hash. Uploaded files, paint and imported meshes aren't included; links from outside are size-checked and clamped, so a crafted link can't freeze the tab.
- **Copy text** (Export → Copy text, or `t`) copies the current frame as plain-text ASCII. `OhMyAsciiHandle.getText()` exposes the same for your own code.
- **Video** (Export → Video) records a 5-second WebM of the canvas (worlds: exactly one loop, up to 30 s).
- **Paste** an image or image URL anywhere, or drag an image in from another tab, to convert it.
- **Shortcuts** (modeller keys above): `space` pause · `r` replay · `u` upload · `x` randomize look · `c` copy code · `s` share · `t` copy text · `f` fullscreen · `⌘Z`/`⇧⌘Z` undo/redo (also restores which mode you were in) · `?` help.
- **X / Y / Z rows** (position, rotation, stretch, spin): type a value, or drag the axis letter sideways to scrub (shift = fine); double-click a letter to reset it.
- **Copy PNG** puts the current frame on the clipboard. Downloads are named after the source (`logo.svg` → `logo-ascii.png`).
- **Sliders:** double-click to reset to default, click the number to type a value; a dot marks changed values.
- **Session** is saved to `localStorage` and restored on reload; if browser storage is full the studio says so once (export JSON to keep big scenes).
