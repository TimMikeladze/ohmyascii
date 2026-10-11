import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG, mergeConfig } from '../../lib/ascii/config'
import { WORLD_PRESETS } from '../../lib/ascii/worlds'
import { STUDIO_DEFAULTS, encodeShare, decodeShare, shareFragment } from './share'

// Share links (`#s=…`) carry the config diff plus a source — and, for worlds, the serialized
// world itself. The home page builds them to hand a chat scene to the studio.

describe('encodeShare / decodeShare', () => {
  it('round-trips a world source with its payload', () => {
    const cfg = mergeConfig(WORLD_PRESETS[0].config)
    const world = WORLD_PRESETS[0].world()
    const hash = encodeShare(cfg, { kind: 'world' }, undefined, world)
    const back = decodeShare(`#s=${hash}`)!
    expect(back.source).toEqual({ kind: 'world' })
    expect(back.world?.objects.map((o) => o.geom)).toEqual(world.objects.map((o) => o.geom))
    expect(back.cfg).toEqual(cfg)
  })

  it('round-trips a preset source and only the config diff', () => {
    const cfg = { ...DEFAULT_CONFIG, cellSize: 9 }
    const back = decodeShare(`#s=${encodeShare(cfg, { kind: 'preset', key: 'starburst' })}`)!
    expect(back.source).toEqual({ kind: 'preset', key: 'starburst' })
    expect(back.cfg.cellSize).toBe(9)
    // Keys left at default are dropped from the link and re-filled on decode.
    expect(back.cfg.charset).toBe(DEFAULT_CONFIG.charset)
  })

  it('drops uploads from links and ignores unknown config keys', () => {
    const back = decodeShare(
      `#s=${encodeShare({ ...DEFAULT_CONFIG, cellSize: 11 }, { kind: 'upload', url: 'blob:x', name: 'a.png' })}`,
    )!
    expect(back.source).toBeUndefined()
    expect(back.cfg.cellSize).toBe(11)
  })

  it('returns null for hashes without a share payload', () => {
    expect(decodeShare('')).toBeNull()
    expect(decodeShare('#w=orrery')).toBeNull()
    expect(decodeShare('#s=not-base64!!')).toBeNull()
  })

  it('compressed links are shorter and decode to the same state', () => {
    const cfg = mergeConfig(WORLD_PRESETS[0].config)
    const world = WORLD_PRESETS[0].world()
    const frag = shareFragment(cfg, { kind: 'world' }, undefined, world)
    expect(frag.startsWith('z=')).toBe(true)
    expect(frag.length).toBeLessThan(encodeShare(cfg, { kind: 'world' }, undefined, world).length / 3)
    const back = decodeShare(`#${frag}`)!
    expect(back.world?.objects.length).toBe(world.objects.length)
    expect(back.cfg).toEqual(cfg)
  })

  it('type-checks the payload: bad sources are dropped, config is clamped', () => {
    const raw = (data: unknown) => `#s=${btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
    // A preset without a key used to crash the studio on every reload.
    expect(decodeShare(raw({ s: { kind: 'preset' } }))!.source).toBeUndefined()
    const text = decodeShare(raw({ s: { kind: 'text', text: 'HI', fontKey: "x', evil: '", weight: 1e9 } }))!.source
    expect(text).toEqual({ kind: 'text', text: 'HI', fontKey: 'geist-mono', weight: 900 })
    const cfg = decodeShare(raw({ c: { smooth: 1e7, inertia: 5, cellSize: '9', charset: 'x'.repeat(5000) } }))!.cfg
    expect([cfg.smooth, cfg.inertia, cfg.cellSize, cfg.charset.length]).toEqual([8, 0.95, DEFAULT_CONFIG.cellSize, 64])
  })

  it('studio links stay still unless they ask for motion; a chosen spin survives', () => {
    const still = decodeShare(`#s=${btoa('{"c":{}}')}`, STUDIO_DEFAULTS)!
    expect(still.cfg.motion).toBe('static')
    const spin = decodeShare(`#${shareFragment({ ...STUDIO_DEFAULTS, motion: 'spin' }, { kind: 'preset', key: 'bolt' })}`, STUDIO_DEFAULTS)!
    expect(spin.cfg.motion).toBe('spin')
  })
})
