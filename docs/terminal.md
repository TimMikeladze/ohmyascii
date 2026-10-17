# Terminal

Every studio piece plays in a terminal: gallery worlds, modelled scenes, and image / text / preset pieces, in full colour. There's a CLI, a library, and a Terminal button in the studio.

## Use it

```bash
bun run cli                                   # browse the gallery (in this repo)
bun run terminal:link                         # build + `bun link` → `ohmyascii` on your PATH
ohmyascii koi                              # gallery key
ohmyascii ./logo.ascii.json --watch        # piece file; reloads when the studio / an agent saves it
ohmyascii 'http://localhost:3000/studio#s=…'   # studio link (studio → Terminal copies this)
cat piece.json | ohmyascii play -          # stdin
ohmyascii render koi --cols 80 --rows 24 --color none   # one frame
ohmyascii bake koi --seconds 8 > koi.sh    # self-playing sh script
ohmyascii bake koi --format cast > koi.cast && asciinema play koi.cast
ohmyascii guide                            # embedding guide
ohmyascii --version / --help               # never open the player
```

Keys: ←/→ scene · w a s d orbit · 0 reset camera · space pause · +/- speed · c colour mode · g gallery · q quit.

Flags: `--watch` · `--t <s>` (render time) · `--cols` / `--rows` (integers ≥ 1) · `--color truecolor|256|none|auto` · `--fps` · `--seconds` · `--format sh|cast|json|ans` · `--aspect` · `--bg on|off` · `-v` · `-h`. Unknown flags, missing values (`--cols --watch`) and bad values are errors (exit 2); a value flag never swallows the next `--flag`. `--name=value` works too.

Bake formats:
- `sh` (default): a POSIX script that loops the frames with `sleep`; ctrl-c restores the cursor.
- `cast`: an [asciinema v2](https://docs.asciinema.org/manual/asciicast/v2/) recording: a header line `{"version":2,"width","height","env":{"TERM"}}` (no timestamp, so bakes are reproducible), then one `[seconds, "o", clear + home + frame]` event per frame. Plays in `asciinema play` and the asciinema web player.
- `json`: `{ fps, cols, rows, frames[] }`, each frame the lines joined by `\n`.
- `ans`: every frame back to back, each prefixed with cursor-home (`ESC[H`). No timing and no clear: `cat koi.ans` races through them and ends on the last frame. Use it as raw material for your own player.

Colour: `--color` wins. Otherwise `FORCE_COLOR` (`0` none, `1`/`2` 256, `3` truecolor) beats `NO_COLOR` (none); `TERM=dumb` is none; `COLORTERM=truecolor|24bit` or a known truecolor terminal (iTerm, WezTerm, VS Code, Ghostty, kitty, Alacritty, Windows Terminal) is truecolor; anything else (`linux`, `vt100`, unknown `TERM`, Apple Terminal) gets 256 at most. `render` prints plain text when stdout isn't a terminal unless `--color` or `FORCE_COLOR` is set, so pipes stay clean. `bake` writes a file to play later, so it keeps the detected depth; pass `--color none` for a plain one.

Player behaviour:
- The terminal is always restored (alt screen left, cursor shown, raw mode off) on quit, ctrl-c, SIGHUP / SIGTERM, and uncaught errors. A failed `--watch` reload just shows the error in the status line.
- Only rows that changed since the last frame are rewritten; a resize clears and repaints. Resizes are debounced and only rebuild the piece when the size actually changes (not when `--cols` / `--rows` fix it).
- The piece never draws wider or taller than the terminal; the status line and gallery rows are cut to the terminal width.
- `--watch` watches the piece's folder and filters by file name, so editors that save atomically (write a temp file, rename it over) keep reloading.
- `play -` needs a piece piped in; with a terminal on stdin it exits with "no piece on stdin".

Studio → Export → **Terminal** copies one of:
- `ohmyascii play './<piece>.ascii.json' --watch` when a folder is held. Run it in that folder and studio edits show live.
- `ohmyascii play '<share link>'` otherwise. Uploaded images can't go in a link; hold a folder for those.

## Embed it

`packages/terminal` is the `ohmyascii` package: the bin plus a typed library, bundled by tsup (`bun run terminal:build`). It's private and not published yet.

```ts
import { openPiece, openTerminalPiece } from 'ohmyascii'

const r = await openTerminalPiece(openPiece('./logo.ascii.json'), { cols: process.stdout.columns, rows: process.stdout.rows })
const t0 = Date.now()
process.on('exit', () => process.stdout.write('\x1b[0m\x1b[?25h\n')) // reset colour, show the cursor again
process.on('SIGINT', () => process.exit(130))
process.stdout.write('\x1b[?25l\x1b[2J') // hide cursor, clear
setInterval(() => process.stdout.write('\x1b[H' + r.frame((Date.now() - t0) / 1000).join('\n')), 1000 / 30)
```

`frameDiff(prev, next)` returns only the escapes for rows that changed (what the player uses); `toAsciicast(frames, { cols, rows, fps })` builds a `.cast` file; `truncateAnsi(line, width)` cuts a coloured line to a visible width.

`frame(t, { userX, userY })` returns one ANSI line per row; the optional view orbits the camera, in radians. `r.errors` lists assets that failed to load (for example a missing image) and `r.skipped` lists objects not drawn. Everything else still renders.

No JavaScript in your app? Use `bake --format json` (`{ fps, cols, rows, frames[] }`), `cast` or `ans` (see Bake formats).

## How it works

- **Same renderers.** `lib/ascii/headless.ts` `createHeadlessPlayer` builds a piece once and renders frames into any 2D context. `lib/ascii/terminal.ts` passes a *recording* context: each `fillText(glyph, x, y)` lands in a cell grid tagged with the current `fillStyle`. So terminal colours equal canvas colours.
- **Canvas in Node.** `lib/ascii/node-canvas.ts` shims `document.createElement('canvas')`, `Image`, `document.fonts` and `getComputedStyle` with `@napi-rs/canvas`. The browser loaders (`source.ts`, `model.ts`, `world-assets.ts`) then run unchanged. `lib/ascii/assets.ts` `loadPieceAssets` pre-builds image / text / preset sources and text / image world objects. Relative image paths resolve against the piece file's folder.
- **Inputs.** `lib/ascii/terminal-node.ts` `openPiece` accepts a gallery key, a file path, a studio link (`#s=` / `#w=`), raw JSON, or `-`.
- **Terminal cells are tall.** Pieces are tuned for square cells, so `cellAspect` defaults to 2 (CLI `--aspect`).
- **Background.** Each line is painted in the piece's `bg` (CLI `--bg off` to skip). Dim fields are tuned to vanish against it and would otherwise show up as stripes on a grey terminal theme.
- Colour depth: `truecolor`, `256` (xterm cube + grey ramp) or `none`, detected by `detectColorDepth` (rules above). An escape code is emitted only when the colour changes.
- The MCP `render_piece` / `write_piece` preview uses the same path, so agents can preview every kind of piece. There, image paths are confined to the studio folder and remote images are off (`loadPieceAssets` `root` / `allowRemote`); the CLI loads whatever path or URL the piece names.
- Arguments are parsed in `packages/terminal/src/args.ts` (tested without a TTY); `cli.ts` runs on import.

## Limits

- `blob:` image URLs exist only in the browser tab that made them. Uploads must be saved to a folder first.
- Fonts: text uses system monospace (Menlo / DejaVu …). The web fonts (Geist, JetBrains …) aren't bundled.
- Frame cost is the renderer's own. Most scenes take under 30 ms at 160×45. `ufo` takes about 200 ms because its cornfield terrain is rebuilt every frame, the same as in the browser.
