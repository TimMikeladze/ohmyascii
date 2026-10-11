import { mergeConfig } from './config'
import { createHeadlessPlayer, type HeadlessAssets, type HeadlessPlayer, type HeadlessView } from './headless'
import type { Piece } from './piece'

// Terminal output for headless pieces. A recording canvas context captures every glyph the
// renderer draws (fillText) with its current fillStyle, so terminal colours match the canvas
// without touching the renderers.

export type ColorDepth = 'truecolor' | '256' | 'none'

export interface Cell {
  char: string
  /** 0xRRGGBB, or -1 when nothing was drawn. */
  rgb: number
}

export function parseColor(style: unknown): number {
  if (typeof style !== 'string') return 0xffffff
  const s = style.trim()
  if (s[0] === '#') {
    let h = s.slice(1)
    if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((c) => c + c).join('')
    const n = parseInt(h.slice(0, 6), 16)
    return Number.isNaN(n) ? 0xffffff : n
  }
  const m = s.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i)
  if (m) return (clamp(+m[1]) << 16) | (clamp(+m[2]) << 8) | clamp(+m[3])
  return 0xffffff
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))

/** A fake 2D context that records glyphs into a cols×rows grid. */
export function recordingContext(cols: number, rows: number, cw: number, ch: number) {
  const cells: Cell[] = Array.from({ length: cols * rows }, () => ({ char: ' ', rgb: -1 }))
  let fill = 0xffffff
  const noop = () => {}
  // Plain object (not a Proxy): fillText runs once per visible glyph per frame.
  const target: Record<string, unknown> = {
    fillText(text: string, x: number, y: number) {
      const c = Math.floor(x / cw)
      const r = Math.floor(y / ch)
      if (c < 0 || r < 0 || c >= cols || r >= rows || !text || text === ' ') return
      const cell = cells[r * cols + c]
      cell.char = text
      cell.rgb = fill
    },
    measureText: () => ({ width: cw }),
  }
  for (const k of ['fillRect', 'setTransform', 'clearRect', 'drawImage', 'save', 'restore', 'strokeText', 'beginPath', 'moveTo', 'lineTo', 'arc', 'closePath', 'fill', 'stroke'])
    target[k] = noop
  Object.defineProperty(target, 'fillStyle', {
    get: () => '#ffffff',
    set: (v: unknown) => {
      fill = parseColor(v)
    },
  })
  const ctx = target as unknown as CanvasRenderingContext2D
  return {
    ctx,
    cells,
    reset() {
      for (const c of cells) {
        c.char = ' '
        c.rgb = -1
      }
    },
  }
}

function ansi256(rgb: number): number {
  const r = (rgb >> 16) & 255
  const g = (rgb >> 8) & 255
  const b = rgb & 255
  if (r === g && g === b) {
    if (r < 8) return 16
    if (r > 248) return 231
    return 232 + Math.round(((r - 8) / 247) * 24)
  }
  const q = (v: number) => Math.round((v / 255) * 5)
  return 16 + 36 * q(r) + 6 * q(g) + q(b)
}

function fgCode(rgb: number, depth: ColorDepth): string {
  if (depth === 'truecolor') return `\x1b[38;2;${(rgb >> 16) & 255};${(rgb >> 8) & 255};${rgb & 255}m`
  return `\x1b[38;5;${ansi256(rgb)}m`
}

/** Joins a cell grid into lines, emitting a colour escape only when the colour changes. */
export function cellsToAnsi(cells: Cell[], cols: number, rows: number, depth: ColorDepth = 'truecolor', bg?: number): string[] {
  const lines: string[] = []
  // Background is set once per line; fg escapes (38;…) leave it in place.
  const bgCode = depth === 'none' || bg === undefined ? '' : fgCode(bg, depth).replace('[38;', '[48;')
  for (let r = 0; r < rows; r++) {
    let line = bgCode
    let last = ''
    for (let c = 0; c < cols; c++) {
      const cell = cells[r * cols + c]
      if (depth !== 'none' && cell.rgb >= 0) {
        const code = fgCode(cell.rgb, depth)
        if (code !== last) line += last = code
      }
      line += cell.char
    }
    lines.push(depth === 'none' ? line : line + '\x1b[0m')
  }
  return lines
}

export interface TerminalRenderer {
  cols: number
  rows: number
  skipped: string[]
  /** One frame as lines of text (with ANSI colour unless depth is 'none'). `view` nudges the camera. */
  frame(t: number, view?: HeadlessView): string[]
}

export interface TerminalOptions {
  cols: number
  rows: number
  depth?: ColorDepth
  /** Terminal cell height ÷ width (default 2). Pieces are tuned for square cells; terminal glyphs are tall. */
  cellAspect?: number
  /** Paint the piece's own background colour (default true). Dim fields are tuned to vanish against it. */
  background?: boolean
  /** Canvas-built models for image / text / preset pieces (see openTerminalPiece / loadPieceAssets). */
  assets?: HeadlessAssets
}

/** Renders a world or scene piece to coloured terminal lines. */
export function createTerminalRenderer(piece: Piece, opts: TerminalOptions): TerminalRenderer {
  const player: HeadlessPlayer = createHeadlessPlayer(piece, { cols: opts.cols, rows: opts.rows, cellAspect: opts.cellAspect ?? 2, assets: opts.assets })
  const cfg = mergeConfig(piece.config)
  const bg = opts.background === false || cfg.transparentBg ? undefined : parseColor(cfg.bg)
  const rec = recordingContext(player.cols, player.rows, player.cw, player.ch)
  const depth = opts.depth ?? detectColorDepth()
  return {
    cols: player.cols,
    rows: player.rows,
    skipped: player.skipped,
    frame(t, view) {
      rec.reset()
      player.render(t, rec.ctx, view)
      return cellsToAnsi(rec.cells, player.cols, player.rows, depth, bg)
    },
  }
}

const TRUECOLOR_PROGRAMS = new Set(['iTerm.app', 'WezTerm', 'vscode', 'ghostty', 'Hyper'])

/**
 * Colour depth from the environment. FORCE_COLOR (0–3) wins, then NO_COLOR, TERM=dumb (none),
 * COLORTERM truecolor/24bit and known truecolor terminals; anything else (linux, vt100, unknown
 * TERM, Apple Terminal) gets 256 at most.
 */
export function detectColorDepth(env: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}): ColorDepth {
  const force = env.FORCE_COLOR
  if (force !== undefined) {
    if (force === '0' || force === 'false') return 'none'
    if (force === '3') return 'truecolor'
    if (force === '' || force === 'true' || force === '1' || force === '2') return '256'
  }
  if (env.NO_COLOR) return 'none'
  const term = env.TERM ?? ''
  if (term === 'dumb') return 'none'
  if (/^(truecolor|24bit)$/i.test(env.COLORTERM ?? '')) return 'truecolor'
  if (TRUECOLOR_PROGRAMS.has(env.TERM_PROGRAM ?? '') || /-direct$|kitty|ghostty|alacritty|foot/.test(term) || env.WT_SESSION) return 'truecolor'
  return '256'
}

const ESC = /\x1b\[[\d;?]*[A-Za-z]/y

/** Cuts a line to `width` visible characters, skipping ANSI escapes; resets colour if it cut any. */
export function truncateAnsi(line: string, width: number): string {
  let out = ''
  let visible = 0
  let styled = false
  for (let i = 0; i < line.length; ) {
    ESC.lastIndex = i
    const m = ESC.exec(line)
    if (m) {
      out += m[0]
      styled = true
      i += m[0].length
      continue
    }
    const ch = String.fromCodePoint(line.codePointAt(i)!)
    if (visible === width) return out + (styled ? '\x1b[0m' : '')
    out += ch
    visible++
    i += ch.length
  }
  return out
}

/**
 * Escapes that turn the screen from `prev` into `next`: only changed rows are rewritten. Pass
 * prev = null (first frame, resize, after a clear) to repaint every row from the top.
 */
export function frameDiff(prev: string[] | null, next: string[]): string {
  if (!prev || prev.length !== next.length) return '\x1b[H' + next.join('\r\n')
  let out = ''
  for (let r = 0; r < next.length; r++) if (next[r] !== prev[r]) out += `\x1b[${r + 1};1H${next[r]}`
  return out
}

/**
 * An asciinema v2 recording (https://docs.asciinema.org/manual/asciicast/v2/): a header line, then
 * one `[seconds, "o", data]` event per frame that clears, homes and draws it. No timestamp, so
 * the same piece always bakes to the same file.
 */
export function toAsciicast(frames: string[][], opts: { cols: number; rows: number; fps: number; term?: string }): string {
  const header = { version: 2, width: opts.cols, height: opts.rows, env: { TERM: opts.term ?? 'xterm-256color' } }
  const events = frames.map((lines, i) => JSON.stringify([+(i / opts.fps).toFixed(6), 'o', (i === 0 ? '\x1b[?25l' : '') + '\x1b[2J\x1b[H' + lines.join('\r\n')]))
  return [JSON.stringify(header), ...events].join('\n') + '\n'
}
