# Invocation, environment, and delivery

## One canonical skill, two agents

The committed source is `skills/ohmyascii-studio`. `pnpm install` or `pnpm skills:sync` mirrors the complete folder into `.claude/skills/ohmyascii-studio` and `.agents/skills/ohmyascii-studio`. Edit the committed source, then sync; mirrored edits are replaced. The helper requires an ohmyascii checkout and its installed Node dependencies; copying the instructions alone does not install the renderer.

| Environment | Invocation |
|---|---|
| Claude Code, this project | `/ascii a moonlit koi pond, jade and ivory, slow and intricate` |
| Claude Code, skill installed | `/ohmyascii-studio a moonlit koi pond, jade and ivory` |
| Codex, skill installed | `$ohmyascii-studio Create a moonlit koi pond in ascii/moon-pond.ascii.json` |
| Either agent, natural language | “Use the ohmyascii-studio skill to make a quiet ASCII aquarium for an 80×24 terminal.” |

The short `/ascii` alias is `.claude/commands/ascii.md`. It forwards the user's full request to the canonical skill. A copied alias needs the skill too. Codex uses its skill invocation/selector; do not promise that a Claude command file adds a Codex slash command. The main skill keeps portable `name`/`description` frontmatter; Codex interface metadata lives separately in `agents/openai.yaml`.

Local discovery and Claude command behavior were checked against the official [Codex skill documentation](https://developers.openai.com/codex/skills/) and [Claude Code skill documentation](https://code.claude.com/docs/en/skills). If platform behavior differs, inspect the installed client's help and current official docs.

For installation into another project, copy the complete `ohmyascii-studio` folder to that project's `.agents/skills/` for Codex or `.claude/skills/` for Claude Code. Copy the `/ascii` alias into `.claude/commands/` if desired. Supporting references and scripts must travel with `SKILL.md`. Use MCP against an installed renderer or point the helper at its checkout with `--repo`; do not imply that the copied folder is a standalone renderer.

## Choose an execution route

MCP is optional. When connected, `studio_guide` gives current engine details, `list_gallery` and `get_gallery_piece` provide complete tuned examples, and `validate_piece`/`render_piece` validate and preview. `list_pieces` and `read_piece` discover existing work. `write_piece` validates, normalizes, saves and returns one preview. Pass JSON as a string in its `piece` argument, not as the in-app `{world,config}` envelope.

The MCP server's root comes from `OHMYASCII_STUDIO_DIR`, falling back to its working directory. Do not assume it equals the current shell directory. Use its listed paths and tool errors to establish the root. Files and assets must stay within that root; remote images are disabled by default. Re-read an existing piece before replacing it; choose a fresh slug when making a new work.

Without MCP, use plain file edits plus the bundled helper or CLI. Run `pnpm exec tsx <skill-directory>/scripts/inspect.ts --help` for its exact options. Paths supplied to the helper are resolved from the shell's working directory; `--repo` locates code and dependencies, not the output folder. An installed CLI provides `ohmyascii list`, `ohmyascii export koi`, `ohmyascii guide`, `ohmyascii render ...` and playback. Within this checkout, use `pnpm cli` in place of `ohmyascii`.

If dependencies are missing, follow the user's environment/install policy. If unable to render, save the complete piece and report the missing dependency and unverified preview. Do not silently substitute a new animation framework or edit the renderer to accommodate invented scene properties.

## Studio folder feedback

Start the app with `pnpm dev`. In desktop Chrome or Edge, open the studio's **Folder → Open folder** and select the output directory. Only the active piece is rendered. A new piece can auto-open when no other piece is active; otherwise select it in Folder. Do not guarantee auto-selection.

The studio polls around 500 ms and writes frame feedback after roughly 1.5 seconds. Read `<slug>.frame.txt` after about 2 seconds and check its modification time. A disconnected browser or another selected piece leaves old feedback; use the helper instead of waiting indefinitely. Frame text contains glyphs, not reliable color evidence. Inspect colored previews or the browser to judge palette.

Studio changes write back to the same JSON, often with config stored as a diff. Re-read immediately before editing and keep changes scoped. Use a new file for an alternate treatment rather than overwriting an unrelated piece.

## Assets and piece sources

Use `source.kind:"image"` with a path relative to the piece for a supplied SVG, PNG, JPEG, WebP, or GIF. World image geometry uses `geom:{kind:"image",url,depth,relief}`, which is a different field. Keep dependencies in the selected folder and deliver them alongside the JSON. Prefer portable file paths over local `blob:` URLs. Node rendering of a GIF does not establish full animated-image playback; use native world motion for dependable animation.

For an SVG silhouette, use clean white shapes over transparency before extrusion. For a photograph, start with `shape:"relief"`, `maskMode:"none"`, `shade:"both"`, and tune relief and contrast in actual previews. A logo's proportions and clearspace are constraints; do not invent extra brand elements.

Text can use `source:{kind:"text",text,fontKey,weight}`. Keep short lettering large enough to read in the target grid. Browser fonts may fall back to system monospace under Node; inspect the real delivery surface for typographic fidelity.

## Playback and export

```bash
pnpm cli ascii/moon-pond.ascii.json --watch
pnpm cli ascii/moon-pond.ascii.json --cols 80 --rows 24 --aspect 2 --fps 20
pnpm cli render ascii/moon-pond.ascii.json --t 3 --cols 80 --rows 24 --color none
pnpm cli bake ascii/moon-pond.ascii.json --seconds 12 --fps 20 --color truecolor --format sh > /tmp/moon-pond.sh
pnpm cli bake ascii/moon-pond.ascii.json --seconds 12 --fps 20 --color truecolor --format cast > /tmp/moon-pond.cast
```

A baked shell script plays with `sh /tmp/moon-pond.sh`; a cast plays with asciinema. The bake formats are `sh`, `cast`, `json`, and `ans`. Raw `ans` has no timing: `cat` does not give timed playback. Piped output can select no color automatically; pass `--color truecolor` when the recording should retain color. Baking captures only the requested interval and cannot repair a discontinuous loop.

For browser video, use the studio's Export controls and verify its available format. Do not invent a CLI MP4/GIF flag. See `docs/terminal.md`, `docs/worlds.md`, and `docs/studio-folder.md` in a checkout for renderer and delivery integration. `components/ohmyascii.tsx` embeds a piece source in an app; application code changes are a separate deliverable only when requested.

## Handoff contract

Give the user the concrete path first, then a short style description and what was actually verified. End with one command or studio action that takes under two minutes. For example:

> `ascii/moon-pond.ascii.json` — ivory koi circle a jade lotus over quiet ink-blue ripples. Checked at 80×24 across six times; the 12-second seam was inspected in color and text.
>
> Play: `pnpm cli ascii/moon-pond.ascii.json --watch`

Use the sentence about seam inspection only when that work actually happened. If only a parser ran, say “JSON validated; visual playback unverified.” Avoid pasting long JSON into the final reply when the saved file is already accessible, unless the user requests it.
