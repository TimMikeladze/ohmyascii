import { describe, expect, it } from 'vitest'
import { parseArgs } from './args'

describe('parseArgs', () => {
  it('parses commands, shorthand play and flags', () => {
    expect(parseArgs([])).toMatchObject({ cmd: 'browse' })
    expect(parseArgs(['koi', '--watch'])).toMatchObject({ cmd: 'play', target: 'koi', watch: true })
    expect(parseArgs(['render', 'koi', '--cols', '40', '--rows=12', '--color', 'none', '--bg', 'off'])).toMatchObject({ cmd: 'render', target: 'koi', cols: 40, rows: 12, color: 'none', background: false })
    expect(parseArgs(['bake', '-', '--format', 'cast'])).toMatchObject({ cmd: 'bake', target: '-', format: 'cast' })
    expect(parseArgs(['--color', 'auto']).color).toBeUndefined()
    expect(parseArgs(['koi', '-v']).cmd).toBe('version')
    expect(parseArgs(['play', 'koi', '--help']).cmd).toBe('help')
  })

  it('rejects bad input instead of guessing', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/Unknown option --nope/)
    expect(() => parseArgs(['render', 'koi', '--cols', '--watch'])).toThrow(/--cols needs a value/)
    expect(() => parseArgs(['render', 'koi', '--rows'])).toThrow(/needs a value/)
    for (const v of ['0', '-3', '4.5', 'abc', '']) expect(() => parseArgs(['--cols', v])).toThrow(/integer ≥ 1/)
    expect(() => parseArgs(['--format', 'gif'])).toThrow(/sh, ans, json, cast/)
    expect(() => parseArgs(['--color', 'rainbow'])).toThrow(/--color/)
    expect(() => parseArgs(['--bg', 'maybe'])).toThrow(/--bg/)
    expect(() => parseArgs(['--fps', '0'])).toThrow(/--fps/)
  })
})
