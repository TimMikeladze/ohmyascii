/** Read-only piece diagnostics. Run with the renderer checkout's `bun run tsx`. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const HELP = `Usage: bun run tsx <skill>/scripts/inspect.ts <piece-path|gallery-key> [options]
  --repo PATH       ohmyascii checkout (default: find above working directory)
  --list            list all gallery keys
  --json            print complete normalized piece JSON, without rendering
  --cols N          glyph columns, 20–240 (default 96)
  --rows N          glyph rows, 10–120 (default 40)
  --aspect N        cell height / width, 0.5–4 (default piece setting)
  --times CSV       1–12 seconds values, each 0–120 (default 0,T/4,T/2,3T/4,T-.05,T)
  --out PATH        save frames.txt, contact-sheet.png, report.json in this directory
Does not rewrite the piece. PNG previews use the real renderer with headless effects settings.
`

function findRepo(start: string): string {
  let at = resolve(start)
  for (;;) {
    if (existsSync(join(at, 'lib/ascii/worlds.ts')) && existsSync(join(at, 'package.json'))) return at
    const parent = dirname(at)
    if (parent === at) throw new Error('Renderer checkout not found. Pass --repo /path/to/ohmyascii.')
    at = parent
  }
}

// Compare explicitly supplied properties against parser output; added defaults are fine.
// Config is compared to the full parsed config because serialization omits default values.
function changes(raw: unknown, parsed: unknown, path = ''): string[] {
  if (Array.isArray(raw)) {
    if (!Array.isArray(parsed)) return [`${path}: replaced or dropped`]
    return [
      ...(raw.length !== parsed.length ? [`${path}: ${raw.length} entries became ${parsed.length}`] : []),
      ...raw.flatMap((item, i) => changes(item, parsed[i], `${path}[${i}]`)),
    ]
  }
  if (raw !== null && typeof raw === 'object') {
    const got = parsed !== null && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
    return Object.entries(raw).flatMap(([key, value]) => changes(value, got[key], path ? `${path}.${key}` : key))
  }
  if (typeof raw === 'number' && typeof parsed === 'number' && Math.abs(raw - parsed) <= 0.000051) return []
  return raw === parsed ? [] : [`${path}: ${JSON.stringify(raw)} → ${JSON.stringify(parsed) ?? '(dropped)'}`]
}

async function main() {
  const argv = process.argv.slice(2)
  if (argv.includes('--help') || argv.includes('-h')) { console.log(HELP); return }
  const flags = new Map<string, string>()
  const switches = new Set<string>()
  let target: string | undefined
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (['--list', '--json'].includes(arg)) switches.add(arg)
    else if (['--repo', '--cols', '--rows', '--aspect', '--times', '--out'].includes(arg)) {
      const value = argv[++i]
      if (!value || value.startsWith('--')) throw new Error(`${arg} needs a value`)
      flags.set(arg, value)
    } else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
    else if (target) throw new Error('Pass exactly one piece path or gallery key')
    else target = arg
  }
  const repo = flags.has('--repo') ? resolve(flags.get('--repo')!) : findRepo(process.cwd())
  const load = (path: string) => import(pathToFileURL(join(repo, path)).href)
  const studio = await load('lib/mcp/studio.ts') as typeof import('../../../lib/mcp/studio')
  if (switches.has('--list')) { console.log(JSON.stringify(studio.galleryList(), null, 2)); return }
  if (!target) throw new Error('Pass a piece path or gallery key. Use --list or --help.')
  const file = resolve(target)
  const fromFile = existsSync(file)
  if (!fromFile && /[/.\\]/.test(target)) throw new Error(`Piece not found: ${file}`)
  const json = fromFile ? readFileSync(file, 'utf8') : studio.galleryPiece(target)
  const validation = studio.validatePiece(json)
  if (!validation.piece) throw new Error(validation.errors.join('; '))
  const piece = validation.piece
  const pieceModule = await load('lib/ascii/piece.ts') as typeof import('../../../lib/ascii/piece')
  const normalized = pieceModule.serializePiece(piece)
  const repaired = changes(JSON.parse(json), { ...JSON.parse(normalized), config: piece.config })
  if (switches.has('--json')) {
    if (repaired.length) console.error(`Normalization changes:\n${repaired.join('\n')}`)
    console.log(normalized.trimEnd())
    return
  }
  const numeric = (key: string, fallback: number, min: number, max: number, integer = false) => {
    const value = flags.has(key) ? Number(flags.get(key)) : fallback
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value)))
      throw new Error(`${key} must be ${integer ? 'an integer' : 'a number'} in ${min}–${max}`)
    return value
  }
  const cols = numeric('--cols', 96, 20, 240, true)
  const rows = numeric('--rows', 40, 10, 120, true)
  const aspect = numeric('--aspect', piece.config.cellAspect, 0.5, 4)
  const duration = piece.source.kind === 'world' ? piece.source.world.duration : 12
  const times = flags.has('--times') ? flags.get('--times')!.split(',').map((t) => t.trim() ? Number(t) : NaN)
    : [0, duration / 4, duration / 2, duration * 3 / 4, Math.max(0, duration - 0.05), duration]
  if (!times.length || times.length > 12 || times.some((t) => !Number.isFinite(t) || t < 0 || t > 120))
    throw new Error('--times needs 1–12 comma-separated seconds, each in 0–120')
  const assetsModule = await load('lib/ascii/assets.ts') as typeof import('../../../lib/ascii/assets')
  const headless = await load('lib/ascii/headless.ts') as typeof import('../../../lib/ascii/headless')
  const terminal = await load('lib/ascii/terminal.ts') as typeof import('../../../lib/ascii/terminal')
  const assets = await assetsModule.loadPieceAssets(piece, { cols, rows, baseDir: fromFile ? dirname(file) : repo, allowRemote: false })
  const player = headless.createHeadlessPlayer(piece, { cols, rows, cellAspect: aspect, assets })
  const rec = terminal.recordingContext(cols, rows, player.cw, player.ch)
  const frames = times.map((t) => {
    rec.reset()
    const text = player.render(t, rec.ctx)
    return { t, text, cells: rec.cells.map((cell) => ({ ...cell })) }
  })
  const comparisons = frames.slice(1).map((frame, i) => ({
    from: frames[i].t, to: frame.t,
    changedGlyphs: frame.cells.filter((cell, j) => cell.char !== frames[i].cells[j].char).length,
    changedColors: frame.cells.filter((cell, j) => cell.rgb !== frames[i].cells[j].rgb).length,
  }))
  const report = {
    target, cols, rows, aspect, times,
    normalizationChanges: repaired,
    warnings: validation.warnings,
    skipped: [...player.skipped, ...assets.errors],
    comparisons,
    effects: 'Headless preview disables intro, shimmer, and grid dots; verify those in the studio.',
  }
  const text = frames.map((frame) => `t = ${frame.t}s\n${frame.text}`).join('\n\n') + '\n'
  if (flags.has('--out')) {
    const out = resolve(flags.get('--out')!)
    mkdirSync(out, { recursive: true })
    // Resolve canvas from the renderer checkout, even when this skill is installed elsewhere.
    const require = createRequire(join(repo, 'package.json'))
    const { createCanvas } = require('@napi-rs/canvas') as typeof import('@napi-rs/canvas')
    const cellWidth = 10
    const cellHeight = cellWidth * aspect
    const tileWidth = cols * cellWidth + 24
    const tileHeight = rows * cellHeight + 42
    const across = Math.min(3, frames.length)
    const canvas = createCanvas(Math.ceil(tileWidth * across), Math.ceil(tileHeight * Math.ceil(frames.length / across)))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#17191e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < frames.length; i++) {
      const x = (i % across) * tileWidth + 12
      const y = Math.floor(i / across) * tileHeight + 30
      ctx.fillStyle = '#dce4ec'
      ctx.font = '12px monospace'
      ctx.fillText(`${piece.name ?? target} · ${frames[i].t}s`, x, y - 10)
      ctx.fillStyle = piece.config.bg
      ctx.fillRect(x, y, cols * cellWidth, rows * cellHeight)
      ctx.font = `${piece.config.fontWeight} ${Math.max(8, cellHeight * 0.92)}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      frames[i].cells.forEach((cell, j) => {
        if (cell.rgb < 0 || cell.char === ' ') return
        ctx.fillStyle = `#${cell.rgb.toString(16).padStart(6, '0')}`
        ctx.fillText(cell.char, x + (j % cols + 0.5) * cellWidth, y + (Math.floor(j / cols) + 0.5) * cellHeight, cellWidth)
      })
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
    writeFileSync(join(out, 'frames.txt'), text)
    writeFileSync(join(out, 'contact-sheet.png'), canvas.toBuffer('image/png'))
    writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify({ ...report, output: out }, null, 2))
  } else {
    console.log(JSON.stringify(report, null, 2))
    console.log(text)
  }
  if (report.skipped.length) process.exitCode = 1
}

main().catch((error) => { console.error(`inspect: ${error instanceof Error ? error.message : error}`); process.exitCode = 1 })
