import type { ColorDepth } from '../../../lib/ascii/terminal'

// CLI argument parsing, kept apart from cli.ts (which runs on import) so it can be tested.

export type BakeFormat = 'sh' | 'ans' | 'json' | 'cast'

export interface Args {
  cmd: string
  target?: string
  t: number
  cols?: number
  rows?: number
  /** Undefined = auto (see detectColorDepth; none when piping render / bake). */
  color?: ColorDepth
  fps?: number
  seconds?: number
  aspect: number
  background: boolean
  watch: boolean
  format: BakeFormat
}

export const COMMANDS = new Set(['browse', 'play', 'render', 'bake', 'list', 'export', 'guide', 'help', 'version'])

const BOOLEAN = new Set(['watch', 'help', 'version'])
const VALUE = new Set(['t', 'cols', 'rows', 'color', 'fps', 'seconds', 'aspect', 'bg', 'format'])
const ALIASES: Record<string, string> = { '-h': 'help', '-v': 'version' }

const oneOf = <T extends string>(flag: string, v: string, allowed: readonly T[]): T => {
  if ((allowed as readonly string[]).includes(v)) return v as T
  throw new Error(`--${flag} must be one of ${allowed.join(', ')} (got "${v}")`)
}

function number(flag: string, v: string, { int = false, min = 0, exclusive = false } = {}): number {
  const n = Number(v)
  const ok = v.trim() !== '' && Number.isFinite(n) && (!int || Number.isInteger(n)) && (exclusive ? n > min : n >= min)
  if (!ok) throw new Error(`--${flag} must be ${int ? 'an integer' : 'a number'} ${exclusive ? '>' : '≥'} ${min} (got "${v}")`)
  return n
}

/** Parses argv; throws a usage Error for unknown flags, missing values and bad values. */
export function parseArgs(argv: string[]): Args {
  const pos: string[] = []
  const flags: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-' || !a.startsWith('-')) {
      pos.push(a)
      continue
    }
    if (a === '--') {
      pos.push(...argv.slice(i + 1))
      break
    }
    const eq = a.indexOf('=')
    const name = ALIASES[a] ?? (a.startsWith('--') ? a.slice(2, eq > 0 ? eq : undefined) : '')
    if (BOOLEAN.has(name)) {
      if (eq > 0) throw new Error(`--${name} takes no value`)
      flags[name] = '1'
    } else if (VALUE.has(name)) {
      const v = eq > 0 ? a.slice(eq + 1) : argv[i + 1]
      // A value flag never swallows the next flag: `--cols --watch` is a missing value.
      if (v === undefined || (eq < 0 && v.startsWith('--'))) throw new Error(`--${name} needs a value`)
      if (eq < 0) i++
      flags[name] = v
    } else throw new Error(`Unknown option ${a}. See \`ohmyascii --help\`.`)
  }

  // `ohmyascii koi` / `ohmyascii ./x.ascii.json` are shorthand for play.
  const [first, second] = pos
  const cmd = flags.help ? 'help' : flags.version ? 'version' : first === undefined ? 'browse' : COMMANDS.has(first) ? first : 'play'
  const has = (k: string) => flags[k] !== undefined
  return {
    cmd,
    target: cmd === 'play' && !COMMANDS.has(first ?? '') ? first : second,
    t: has('t') ? number('t', flags.t) : 1,
    cols: has('cols') ? number('cols', flags.cols, { int: true, min: 1 }) : undefined,
    rows: has('rows') ? number('rows', flags.rows, { int: true, min: 1 }) : undefined,
    color: has('color') && flags.color !== 'auto' ? oneOf('color', flags.color, ['truecolor', '256', 'none', 'auto'] as const) as ColorDepth : undefined,
    fps: has('fps') ? number('fps', flags.fps, { exclusive: true }) : undefined,
    seconds: has('seconds') ? number('seconds', flags.seconds, { exclusive: true }) : undefined,
    aspect: has('aspect') ? number('aspect', flags.aspect, { exclusive: true }) : 2,
    background: has('bg') ? oneOf('bg', flags.bg, ['on', 'off'] as const) === 'on' : true,
    watch: flags.watch === '1',
    format: has('format') ? oneOf('format', flags.format, ['sh', 'ans', 'json', 'cast'] as const) : 'sh',
  }
}
