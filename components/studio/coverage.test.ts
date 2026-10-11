import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseScene, serializeScene, starterScene } from '../../lib/ascii/scene'
import { parseWorld, serializeWorld } from '../../lib/ascii/world'
import { WORLD_PRESETS } from '../../lib/ascii/worlds'
import { COVERAGE } from './coverage'

// Studio ⇄ JSON parity (AGENTS.md). coverage.ts makes every stored key name its studio control
// (typecheck enforces the key list); this checks the controls exist, and that JSON keeps all of it.

const dir = join(__dirname)
const studioSource = readdirSync(dir)
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => readFileSync(join(dir, f), 'utf8'))
  .join('\n')

describe('studio ⇄ JSON parity', () => {
  it('every stored key is edited by a control that exists in the studio', () => {
    const missing: string[] = []
    for (const [table, keys] of Object.entries(COVERAGE)) {
      for (const [key, label] of Object.entries(keys)) {
        if (label === null) {
          if (key !== 'id') missing.push(`${table}.${key}: only ids may be internal`)
        } else if (!studioSource.includes(label)) missing.push(`${table}.${key}: no "${label}" control in components/studio`)
      }
    }
    expect(missing).toEqual([])
  })

  it('JSON round-trips everything the studio edits (every gallery world, the modeller scene)', () => {
    for (const p of WORLD_PRESETS) {
      const json = serializeWorld(p.world())
      expect(serializeWorld(parseWorld(JSON.parse(JSON.stringify(json)))!), p.key).toEqual(json)
    }
    const scene = serializeScene(starterScene())
    expect(serializeScene(parseScene(JSON.parse(JSON.stringify(scene)))!)).toEqual(scene)
  })
})
