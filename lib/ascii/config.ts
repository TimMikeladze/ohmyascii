export type ShapeMode = 'extrude' | 'relief'
export type MaskMode = 'auto' | 'alpha' | 'luma' | 'luma-invert' | 'none'
export type ColorMode = 'mono' | 'gradient' | 'depth' | 'source'
export type ShadeMode = 'light' | 'image' | 'both'
export type MotionMode = 'static' | 'spin' | 'sway'
export type FontKey = 'geist-mono' | 'jetbrains' | 'space' | 'plex' | 'system'

export interface AsciiConfig {
  // Geometry
  shape: ShapeMode
  maskMode: MaskMode
  invertMask: boolean
  threshold: number
  smooth: number
  thickness: number
  reliefDepth: number

  // Glyphs
  charset: string
  fontKey: FontKey
  fontWeight: number
  cellSize: number
  cellAspect: number
  glyphScale: number

  // Color
  colorMode: ColorMode
  fg: string
  fg2: string
  bg: string
  transparentBg: boolean

  // Tone + light
  shade: ShadeMode
  brightness: number
  contrast: number
  gamma: number
  invert: boolean
  ambient: number
  lightAzimuth: number
  lightElevation: number
  pointerLight: boolean
  depthFade: number

  // Background grid
  gridDots: boolean
  gridChar: string
  gridColor: string
  gridOpacity: number

  // View + motion
  motion: MotionMode
  rotX: number
  rotY: number
  rotZ: number
  spinX: number
  spinY: number
  spinZ: number
  swayX: number
  swayY: number
  swaySpeed: number
  interactive: boolean
  inertia: number
  wheelZoom: boolean
  zoom: number
  perspective: number
  offsetX: number
  offsetY: number

  // Effects
  waveAmp: number
  waveFreq: number
  waveSpeed: number
  shimmer: number
  scanStrength: number
  scanSpeed: number
  intro: number
}

export const DEFAULT_CONFIG: AsciiConfig = {
  shape: 'extrude',
  maskMode: 'auto',
  invertMask: false,
  threshold: 0.5,
  smooth: 1,
  thickness: 0.22,
  reliefDepth: 0.35,

  charset: ' .·:▴▲',
  fontKey: 'geist-mono',
  fontWeight: 500,
  cellSize: 7,
  cellAspect: 1,
  glyphScale: 1.1,

  colorMode: 'gradient',
  fg: '#e4e4e4',
  fg2: '#6a6a6a',
  bg: '#0f0f0f',
  transparentBg: false,

  shade: 'light',
  brightness: 0.08,
  contrast: 1.15,
  gamma: 1,
  invert: false,
  ambient: 0.22,
  lightAzimuth: -35,
  lightElevation: 35,
  pointerLight: false,
  depthFade: 0.25,

  gridDots: true,
  gridChar: '·',
  gridColor: '#ffffff',
  gridOpacity: 0.1,

  motion: 'spin',
  rotX: -24,
  rotY: 32,
  rotZ: 0,
  spinX: 0,
  spinY: 22,
  spinZ: 0,
  swayX: 8,
  swayY: 28,
  swaySpeed: 0.8,
  interactive: true,
  inertia: 0.06,
  wheelZoom: false,
  zoom: 1,
  perspective: 0.35,
  offsetX: 0,
  offsetY: 0,

  waveAmp: 0,
  waveFreq: 6,
  waveSpeed: 1.5,
  shimmer: 0.04,
  scanStrength: 0,
  scanSpeed: 0.25,
  intro: 1.2,
}

export const FONT_OPTIONS: { key: FontKey; label: string; cssVar: string | null }[] = [
  { key: 'geist-mono', label: 'Geist Mono', cssVar: '--font-geist-mono' },
  { key: 'jetbrains', label: 'JetBrains Mono', cssVar: '--font-jetbrains' },
  { key: 'space', label: 'Space Mono', cssVar: '--font-space' },
  { key: 'plex', label: 'IBM Plex Mono', cssVar: '--font-plex' },
  { key: 'system', label: 'System mono', cssVar: null },
]

const SYSTEM_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export function resolveFontFamily(key: FontKey): string {
  const option = FONT_OPTIONS.find((f) => f.key === key)
  if (!option?.cssVar || typeof document === 'undefined') return SYSTEM_MONO
  const value = getComputedStyle(document.documentElement).getPropertyValue(option.cssVar).trim()
  return value ? `${value}, ${SYSTEM_MONO}` : SYSTEM_MONO
}

export const CHARSETS: { key: string; label: string; value: string }[] = [
  { key: 'vortex', label: 'Dots + triangles', value: ' .·:▴▲' },
  { key: 'classic', label: 'Classic ramp', value: ' .:-=+*#%@' },
  { key: 'dots', label: 'Dots', value: ' ·.:∙•●' },
  { key: 'blocks', label: 'Blocks', value: ' ░▒▓█' },
  { key: 'binary', label: 'Binary', value: ' 01' },
  { key: 'slashes', label: 'Hatch', value: ' ./\\|+#' },
  { key: 'braille', label: 'Braille', value: ' ⠁⠃⠇⡇⣇⣧⣷⣿' },
  { key: 'letters', label: 'Letters', value: ' .coCO0@' },
]

export interface LookPreset {
  key: string
  label: string
  patch: Partial<AsciiConfig>
}

export const LOOKS: LookPreset[] = [
  {
    key: 'vortex',
    label: 'Vortex',
    patch: {
      charset: ' .·:▴▲',
      colorMode: 'gradient',
      fg: '#e4e4e4',
      fg2: '#6a6a6a',
      bg: '#0f0f0f',
      transparentBg: false,
      gridDots: true,
      gridChar: '·',
      gridColor: '#ffffff',
      gridOpacity: 0.1,
      cellSize: 7,
      invert: false,
    },
  },
  {
    key: 'terminal',
    label: 'Terminal',
    patch: {
      charset: ' .:-=+*#%@',
      colorMode: 'mono',
      fg: '#f2f2f2',
      bg: '#0a0a0a',
      transparentBg: false,
      gridDots: false,
      cellSize: 8,
      invert: false,
    },
  },
  {
    key: 'blocks',
    label: 'Blocks',
    patch: {
      charset: ' ░▒▓█',
      colorMode: 'gradient',
      fg: '#ffffff',
      fg2: '#3b3b3b',
      bg: '#101010',
      transparentBg: false,
      gridDots: false,
      cellSize: 9,
      invert: false,
    },
  },
  {
    key: 'binary',
    label: 'Binary',
    patch: {
      charset: ' 01',
      colorMode: 'depth',
      fg: '#ffffff',
      fg2: '#4a4a4a',
      bg: '#0c0c0c',
      transparentBg: false,
      gridDots: false,
      cellSize: 8,
      invert: false,
    },
  },
  {
    key: 'amber',
    label: 'Amber CRT',
    patch: {
      charset: ' .:+*#',
      colorMode: 'gradient',
      fg: '#ffc46b',
      fg2: '#6b3d12',
      bg: '#120b05',
      transparentBg: false,
      gridDots: true,
      gridChar: '.',
      gridColor: '#ffb454',
      gridOpacity: 0.08,
      cellSize: 8,
      invert: false,
    },
  },
  {
    key: 'blueprint',
    label: 'Blueprint',
    patch: {
      charset: ' .·:+x',
      colorMode: 'gradient',
      fg: '#d4e6ff',
      fg2: '#4a78b8',
      bg: '#0a1a33',
      transparentBg: false,
      gridDots: true,
      gridChar: '+',
      gridColor: '#9cc2ff',
      gridOpacity: 0.07,
      cellSize: 8,
      invert: false,
    },
  },
  {
    key: 'ink',
    label: 'Ink',
    patch: {
      charset: ' .:-=+*#%@',
      colorMode: 'mono',
      fg: '#141414',
      fg2: '#8a8a8a',
      bg: '#e8e8e8',
      transparentBg: false,
      gridDots: true,
      gridChar: '·',
      gridColor: '#000000',
      gridOpacity: 0.12,
      cellSize: 8,
      invert: false,
    },
  },
]

// Safe ranges for every numeric key. Wider than the studio sliders (pieces and AI may go further),
// tight enough that no value can stall a frame (e.g. `smooth` is a blur pass count).
const RANGES: { [K in keyof AsciiConfig]?: [number, number] } = {
  threshold: [0, 1],
  smooth: [0, 8],
  thickness: [0, 2],
  reliefDepth: [0, 2],
  fontWeight: [100, 900],
  cellSize: [3, 64],
  cellAspect: [0.3, 4],
  glyphScale: [0.2, 3],
  brightness: [-1, 1],
  contrast: [0.1, 5],
  gamma: [0.1, 5],
  ambient: [0, 1],
  lightAzimuth: [-360, 360],
  lightElevation: [-90, 90],
  depthFade: [0, 1],
  gridOpacity: [0, 1],
  rotX: [-360, 360],
  rotY: [-360, 360],
  rotZ: [-360, 360],
  spinX: [-720, 720],
  spinY: [-720, 720],
  spinZ: [-720, 720],
  swayX: [0, 180],
  swayY: [0, 180],
  swaySpeed: [0, 10],
  inertia: [0.001, 0.95],
  zoom: [0.05, 10],
  perspective: [0, 1.5],
  offsetX: [-2, 2],
  offsetY: [-2, 2],
  waveAmp: [0, 1],
  waveFreq: [0, 60],
  waveSpeed: [-20, 20],
  shimmer: [0, 1],
  scanStrength: [0, 1],
  scanSpeed: [0, 5],
  intro: [0, 10],
}

const ENUMS: { [K in keyof AsciiConfig]?: readonly string[] } = {
  shape: ['extrude', 'relief'],
  maskMode: ['auto', 'alpha', 'luma', 'luma-invert', 'none'],
  colorMode: ['mono', 'gradient', 'depth', 'source'],
  shade: ['light', 'image', 'both'],
  motion: ['static', 'spin', 'sway'],
  fontKey: ['geist-mono', 'jetbrains', 'space', 'plex', 'system'],
}

const COLOR_KEYS = new Set<keyof AsciiConfig>(['fg', 'fg2', 'bg', 'gridColor'])
const HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i
export const MAX_CHARSET = 64

/** Glyph ramp without control / non-space whitespace characters, at most `max` glyphs. */
export function cleanCharset(value: string, max = MAX_CHARSET): string {
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f\u00a0\u2000-\u200f\u2028-\u202f\u205f\u3000\ufeff]/g, ''))
    .slice(0, max)
    .join('')
}

/**
 * Keeps known keys whose value has the default's type and clamps it to a safe range. Use on any
 * config from outside the app (pieces, share links, AI replies, props).
 */
export function sanitizeConfig(data: unknown): Partial<AsciiConfig> {
  const out: Record<string, unknown> = {}
  if (!data || typeof data !== 'object') return out
  for (const [k, v] of Object.entries(data)) {
    if (!(k in DEFAULT_CONFIG)) continue
    const key = k as keyof AsciiConfig
    if (typeof v !== typeof DEFAULT_CONFIG[key]) continue
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) continue
      const range = RANGES[key]
      out[key] = range ? Math.min(range[1], Math.max(range[0], v)) : v
    } else if (typeof v === 'string') {
      const opts = ENUMS[key]
      if (opts) {
        if (opts.includes(v)) out[key] = v
      } else if (COLOR_KEYS.has(key)) {
        if (HEX.test(v)) out[key] = v
      } else if (key === 'charset') {
        const c = cleanCharset(v)
        if (c) out[key] = c
      } else if (key === 'gridChar') {
        const c = cleanCharset(v, 1)
        if (c) out[key] = c
      }
    } else out[key] = v
  }
  return out as Partial<AsciiConfig>
}

/** Defaults overlaid with `partial`, sanitised (out-of-range values are clamped, bad ones dropped). */
export function mergeConfig(partial?: Partial<AsciiConfig>): AsciiConfig {
  return { ...DEFAULT_CONFIG, ...sanitizeConfig(partial) }
}

export function diffFromDefaults(config: AsciiConfig): Partial<AsciiConfig> {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(DEFAULT_CONFIG) as (keyof AsciiConfig)[]) {
    if (config[key] !== DEFAULT_CONFIG[key]) out[key] = config[key]
  }
  return out as Partial<AsciiConfig>
}
