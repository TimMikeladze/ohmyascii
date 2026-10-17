import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { parsePiece } from './piece'
import { loadPieceAssets } from './assets'
import { createHeadlessPlayer } from './headless'
import { validatePiece } from '../mcp/studio'

// Skills and supporting files are mirrored into both agents' discovery directories.
const skills = readdirSync('skills', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : []
  })
}

describe.each(skills)('skill %s', (name) => {
  const md = readFileSync(`skills/${name}/SKILL.md`, 'utf8')

  it('has name + description frontmatter', () => {
    const fm = md.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
    expect(fm).toMatch(new RegExp(`^name: ${name}$`, 'm'))
    expect(fm).toMatch(/^description: .{40,}/m)
  })

  it('only names repo paths that exist', () => {
    const paths = markdownFiles(`skills/${name}`).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/`((?:lib|components|app|docs|scripts|skills)\/[\w./-]+\.\w+)`/g)].map((m) => m[1]))
    expect(paths.length).toBeGreaterThan(0)
    for (const p of paths) expect(existsSync(p), p).toBe(true)
  })

  it('keeps supporting references reachable and JSON examples parseable', () => {
    let examples = 0
    for (const file of markdownFiles(`skills/${name}`)) {
      const text = readFileSync(file, 'utf8')
      for (const link of text.matchAll(/\]\(([^)]+)\)/g)) {
        if (/^https?:/.test(link[1])) continue
        expect(existsSync(resolve(dirname(file), link[1].split('#')[0])), `${file}: ${link[1]}`).toBe(true)
      }
      for (const block of text.matchAll(/```json\n([\s\S]*?)```/g)) {
        const json = JSON.parse(block[1])
        const piece = json.source ? json : { v: 1, source: json, config: {} }
        expect('piece' in parsePiece(JSON.stringify(piece)), file).toBe(true)
        examples++
      }
    }
    expect(examples).toBeGreaterThan(0)
  })
})

describe('animation pattern starters', () => {
  const dir = 'skills/ohmyascii/assets/templates'
  const templates = readdirSync(dir).filter((name) => name.endsWith('.ascii.json'))

  it.each(templates)('%s validates and renders visible motion at terminal size', async (name) => {
    const report = validatePiece(readFileSync(join(dir, name), 'utf8'))
    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([])
    expect(report.piece).not.toBeNull()
    const piece = report.piece!
    const assets = await loadPieceAssets(piece, { cols: 80, rows: 24, baseDir: dir, allowRemote: false })
    expect(assets.errors).toEqual([])
    const player = createHeadlessPlayer(piece, { cols: 80, rows: 24, cellAspect: 2, assets })
    expect(player.skipped).toEqual([])
    const first = player.render(0)
    const later = player.render(2)
    expect(first.trim().length).toBeGreaterThan(10)
    expect(later.trim().length).toBeGreaterThan(10)
    expect(later).not.toBe(first)
  })
})

describe('skill preview helper', () => {
  const script = resolve('skills/ohmyascii/scripts/inspect.ts')
  const run = (...args: string[]) => spawnSync(process.execPath, ['--import', 'tsx', script, ...args], { encoding: 'utf8', timeout: 30_000 })

  it('exports gallery pieces and rejects invalid preview dimensions', () => {
    const gallery = run('koi', '--json')
    expect(gallery.status, gallery.stderr).toBe(0)
    expect('piece' in parsePiece(gallery.stdout)).toBe(true)
    const invalid = run('koi', '--cols', '0')
    expect(invalid.status).toBe(1)
    expect(invalid.stderr).toContain('--cols must be an integer')
  })

  it('reports repairs and creates colored previews without changing the input', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ohmyascii-skill-test-'))
    try {
      const path = join(dir, 'piece.ascii.json')
      const json = JSON.stringify({ v: 1, source: { kind: 'world', world: {
        duration: 2, objects: [{ geom: { kind: 'shape', type: 'sphere' }, opacity: 0.5,
          anim: [{ type: 'spin', axis: 'y', speed: 180 }] }],
      } }, config: { ambient: 5 } })
      writeFileSync(path, json)
      const preview = run(path, '--cols', '20', '--rows', '10', '--times', '0,1,2', '--out', join(dir, 'preview'))
      expect(preview.status, preview.stderr).toBe(0)
      const report = JSON.parse(preview.stdout)
      expect(report.normalizationChanges).toContain('source.world.objects[0].opacity: 0.5 → (dropped)')
      expect(report.normalizationChanges).toContain('config.ambient: 5 → 1')
      expect(report.skipped).toEqual([])
      expect(report.comparisons).toHaveLength(2)
      expect(readFileSync(path, 'utf8')).toBe(json)
      expect(readFileSync(join(dir, 'preview/contact-sheet.png')).subarray(1, 4).toString()).toBe('PNG')
      expect(readFileSync(join(dir, 'preview/frames.txt'), 'utf8')).toContain('t = 2s')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('works when copied outside the checkout with an explicit renderer repo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ohmyascii-installed-skill-'))
    try {
      const copied = join(dir, 'inspect.ts')
      cpSync(script, copied)
      const result = spawnSync(process.execPath, ['--import', 'tsx', copied, '--repo', process.cwd(), '--list'], { encoding: 'utf8', timeout: 30_000 })
      expect(result.status, result.stderr).toBe(0)
      expect(JSON.parse(result.stdout).some((piece: { key: string }) => piece.key === 'koi')).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
