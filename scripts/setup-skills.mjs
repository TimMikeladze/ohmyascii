/**
 * Mirrors `skills/` (the committed source of truth) into `.claude/skills/` and
 * `.agents/skills/` (gitignored), where this repo's agents look for them.
 * Notes: `docs/studio-folder.md`.
 */

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(repoRoot, 'skills')
const mirrors = [resolve(repoRoot, '.claude/skills'), resolve(repoRoot, '.agents/skills')]

const skills = (await readdir(source, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name)

// Each mirror keeps a manifest of what this script put there, so skills removed from skills/ are
// removed from the mirror too, without touching skills someone added to the mirror by hand.
const MANIFEST = '.ohmyascii-skills.json'

for (const mirror of mirrors) {
  await mkdir(mirror, { recursive: true })
  const previous = await readFile(resolve(mirror, MANIFEST), 'utf8').then(JSON.parse, () => [])
  for (const stale of previous.filter((s) => typeof s === 'string' && !skills.includes(s) && !s.includes('/') && !s.startsWith('.')))
    await rm(resolve(mirror, stale), { recursive: true, force: true })
  await writeFile(resolve(mirror, MANIFEST), JSON.stringify(skills) + '\n')
  for (const skill of skills) {
    // Replace rather than merge, so a file deleted upstream doesn't linger.
    await rm(resolve(mirror, skill), { recursive: true, force: true })
    await cp(resolve(source, skill), resolve(mirror, skill), { recursive: true })
  }
}

console.log(`Installed ${skills.length} skill(s): ${skills.join(', ')}`)
