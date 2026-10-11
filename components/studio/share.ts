import { deflateSync, inflateSync } from 'fflate'
import { DEFAULT_CONFIG, FONT_OPTIONS, diffFromDefaults, sanitizeConfig, type AsciiConfig, type FontKey } from '@/lib/ascii/config'
import { MAX_TEXT } from '@/lib/ascii/piece'
import { parseScene, serializeScene, type MeshScene } from '@/lib/ascii/scene'
import { parseWorld, serializeWorld, type World } from '@/lib/ascii/world'
import type { SourceState } from './types'

// Share links: `#z=<base64url deflate-raw JSON>` (or the older uncompressed `#s=<base64url JSON>`)
// holding the config diff, a non-upload source and, for modelled scenes / worlds, their payload
// (paint, imported meshes and local images stay local). Pure functions so the home page and the
// terminal CLI can build and read studio links without pulling in the whole studio component.

/** The studio's baseline: like the component's defaults, but nothing moves until you ask for it. */
export const STUDIO_DEFAULTS: AsciiConfig = { ...DEFAULT_CONFIG, motion: 'static' }

/** A config patch (gallery preset, piece) over the studio baseline. */
export function studioConfig(patch?: Partial<AsciiConfig>): AsciiConfig {
  return { ...STUDIO_DEFAULTS, ...sanitizeConfig(patch) }
}

const b64url = (bytes: Uint8Array) => {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const unb64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0))

function payload(cfg: AsciiConfig, source: SourceState, scene?: MeshScene, world?: World): Uint8Array {
  const src = source.kind === 'upload' ? undefined : source
  const m = source.kind === 'scene' && scene ? serializeScene(scene, true) : undefined
  const w = source.kind === 'world' && world ? serializeWorld(world, true) : undefined
  // `motion` always rides along: the studio and the component default it differently.
  return new TextEncoder().encode(JSON.stringify({ c: { ...diffFromDefaults(cfg), motion: cfg.motion }, s: src, m, w }))
}

/** Uncompressed payload for `#s=` (kept for the session store and older links). */
export function encodeShare(cfg: AsciiConfig, source: SourceState, scene?: MeshScene, world?: World): string {
  return b64url(payload(cfg, source, scene, world))
}

/** Hash fragment (without `#`) for a share link: `z=…` compressed, or `s=…` when that's shorter. */
export function shareFragment(cfg: AsciiConfig, source: SourceState, scene?: MeshScene, world?: World): string {
  const bytes = payload(cfg, source, scene, world)
  const plain = b64url(bytes)
  const packed = b64url(deflateSync(bytes, { level: 9 }))
  return packed.length < plain.length ? `z=${packed}` : `s=${plain}`
}

const FONT_KEYS = new Set<string>(FONT_OPTIONS.map((f) => f.key))

/** A source from a link, type-checked: anything malformed is dropped. */
function parseSourceState(v: unknown): SourceState | undefined {
  if (!v || typeof v !== 'object') return undefined
  const s = v as Record<string, unknown>
  if (s.kind === 'preset') return typeof s.key === 'string' && s.key ? { kind: 'preset', key: s.key.slice(0, 64) } : undefined
  if (s.kind === 'text' && typeof s.text === 'string')
    return {
      kind: 'text',
      text: s.text.slice(0, MAX_TEXT),
      fontKey: typeof s.fontKey === 'string' && FONT_KEYS.has(s.fontKey) ? (s.fontKey as FontKey) : 'geist-mono',
      weight: typeof s.weight === 'number' && Number.isFinite(s.weight) ? Math.min(900, Math.max(100, s.weight)) : 700,
    }
  // A scene / world source without a payload (session restore) uses the separately saved one.
  if (s.kind === 'scene' || s.kind === 'world') return { kind: s.kind }
  return undefined
}

export interface DecodedShare {
  cfg: AsciiConfig
  source?: SourceState
  scene?: MeshScene
  world?: World
}

/**
 * Reads `#z=…` or `#s=…` (anywhere in `hash`). Null when there is none or it doesn't decode. Keys
 * the link leaves out come from `base` (the studio passes STUDIO_DEFAULTS).
 */
export function decodeShare(hash: string, base: AsciiConfig = DEFAULT_CONFIG): DecodedShare | null {
  const m = hash.match(/[#&?]([sz])=([\w-]+)/)
  if (!m) return null
  try {
    const bytes = m[1] === 'z' ? inflateSync(unb64url(m[2])) : unb64url(m[2])
    const data = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
    if (!data || typeof data !== 'object') return null
    const scene = data.m ? (parseScene(data.m) ?? undefined) : undefined
    const world = data.w ? (parseWorld(data.w) ?? undefined) : undefined
    return { cfg: { ...base, ...sanitizeConfig(data.c) }, source: parseSourceState(data.s), scene, world }
  } catch {
    return null
  }
}
