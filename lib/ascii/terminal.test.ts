import { describe, expect, it } from 'vitest'
import { mergeConfig } from './config'
import type { Piece } from './piece'
import { cellsToAnsi, createTerminalRenderer, detectColorDepth, frameDiff, parseColor, toAsciicast, truncateAnsi } from './terminal'
import { getWorldPreset } from './worlds'

const koi = (): Piece => {
  const p = getWorldPreset('koi')!
  return { name: p.label, source: { kind: 'world', world: p.world() }, config: mergeConfig(p.config) } as Piece
}

describe('terminal renderer', () => {
  it('parses canvas colour strings', () => {
    expect(parseColor('#ff8000')).toBe(0xff8000)
    expect(parseColor('#fff')).toBe(0xffffff)
    expect(parseColor('rgb(1, 2, 3)')).toBe(0x010203)
    expect(parseColor('rgba(255,0,0,0.5)')).toBe(0xff0000)
  })

  it('renders a gallery world to sized, coloured lines', () => {
    const r = createTerminalRenderer(koi(), { cols: 60, rows: 20, depth: 'truecolor' })
    const lines = r.frame(1)
    expect(lines).toHaveLength(20)
    expect(lines.join('')).toMatch(/\x1b\[38;2;\d+;\d+;\d+m/)
    // Piece background is painted so dim fields stay dim on any terminal theme.
    expect(lines[0].startsWith('\x1b[48;2;')).toBe(true)
    const plain = createTerminalRenderer(koi(), { cols: 60, rows: 20, depth: 'none' }).frame(1)
    expect(plain.every((l) => [...l].length === 60 && !l.includes('\x1b'))).toBe(true)
    expect(plain.join('').trim().length).toBeGreaterThan(100)
  })

  it('corrects for tall terminal cells', () => {
    // A round pond is wider than tall in characters at aspect 2, and roughly square at aspect 1.
    const extent = (aspect: number) => {
      const lines = createTerminalRenderer(koi(), { cols: 80, rows: 40, depth: 'none', cellAspect: aspect }).frame(0)
      const ink = lines.map((l) => l.replace(/[ .·]/g, ' '))
      const rows = ink.filter((l) => l.trim()).length
      return rows
    }
    expect(extent(2)).toBeLessThan(extent(1))
  })

  it('emits a colour code only when the colour changes', () => {
    const cells = [
      { char: 'a', rgb: 0xff0000 },
      { char: 'b', rgb: 0xff0000 },
      { char: ' ', rgb: -1 },
    ]
    expect(cellsToAnsi(cells, 3, 1, '256')).toEqual(['\x1b[38;5;196mab \x1b[0m'])
  })

  it('detects colour depth from the environment', () => {
    expect(detectColorDepth({ NO_COLOR: '1', COLORTERM: 'truecolor' })).toBe('none')
    expect(detectColorDepth({ COLORTERM: 'truecolor' })).toBe('truecolor')
    expect(detectColorDepth({ TERM: 'dumb', COLORTERM: 'truecolor' })).toBe('none')
    expect(detectColorDepth({ FORCE_COLOR: '0', COLORTERM: 'truecolor' })).toBe('none')
    expect(detectColorDepth({ FORCE_COLOR: '3', NO_COLOR: '1' })).toBe('truecolor')
    expect(detectColorDepth({ FORCE_COLOR: '1' })).toBe('256')
    for (const TERM of ['linux', 'vt100', 'xterm-256color', 'something-odd', undefined]) expect(detectColorDepth({ TERM })).toBe('256')
  })

  it('truncates by visible width, keeping escapes', () => {
    expect(truncateAnsi('\x1b[1mhello\x1b[0m world', 3)).toBe('\x1b[1mhel\x1b[0m')
    expect(truncateAnsi('abc', 5)).toBe('abc')
  })

  it('rewrites only changed rows', () => {
    expect(frameDiff(null, ['a', 'b'])).toBe('\x1b[Ha\r\nb')
    expect(frameDiff(['a', 'b', 'c'], ['a', 'B', 'c'])).toBe('\x1b[2;1HB')
    expect(frameDiff(['a', 'b'], ['a', 'b'])).toBe('')
    expect(frameDiff(['a'], ['a', 'b'])).toBe('\x1b[Ha\r\nb')
  })

  it('bakes an asciinema v2 recording', () => {
    const frames = [0, 0.5].map((t) => createTerminalRenderer(koi(), { cols: 30, rows: 8, depth: '256' }).frame(t))
    const [header, ...events] = toAsciicast(frames, { cols: 30, rows: 8, fps: 2 }).trimEnd().split('\n').map((l) => JSON.parse(l))
    expect(header).toEqual({ version: 2, width: 30, height: 8, env: { TERM: 'xterm-256color' } })
    expect(events.map((e) => e.slice(0, 2))).toEqual([[0, 'o'], [0.5, 'o']])
    expect(events[1][2]).toBe('\x1b[2J\x1b[H' + frames[1].join('\r\n'))
  })
})
