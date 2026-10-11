# ohmyascii

Play ohmyascii pieces in any terminal: animated ASCII worlds, sculpted models, logos and text, in truecolor / 256 colours. Pieces come from the ohmyascii studio (a `*.ascii.json` file, or a share link) or from its built-in gallery.

```bash
ohmyascii                         # browse the gallery
ohmyascii ./logo.ascii.json --watch
ohmyascii 'https://…/studio#s=…'  # studio → Terminal copies this
ohmyascii bake koi > koi.sh       # self-playing script
ohmyascii bake koi --format cast > koi.cast   # asciinema recording
ohmyascii guide                   # embedding guide
ohmyascii --help                  # every command and flag
```

```ts
import { openPiece, openTerminalPiece } from 'ohmyascii'
const r = await openTerminalPiece(openPiece('koi'), { cols: 80, rows: 24 })
process.stdout.write(r.frame(1.5).join('\n'))
```

Colour is auto-detected (`NO_COLOR`, `FORCE_COLOR`, `COLORTERM`, `TERM`); `render` and `bake` print plain text when piped unless you pass `--color`.

Build: `pnpm terminal:build` from the ohmyascii repo root. The full guide is `docs/terminal.md` in that repo.

License: MIT.
