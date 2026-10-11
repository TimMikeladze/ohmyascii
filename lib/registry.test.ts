import { existsSync, readFileSync, statSync } from 'node:fs'
import { builtinModules } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// Every registry item must install and compile on its own: its local import closure (relative and
// `@/` imports) has to be listed in the item, and every package it imports has to be a dependency.

interface Item {
  name: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: { path: string }[]
}

const root = resolve(__dirname, '..')
const registry = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8')) as { items: Item[] }

// shadcn's own registry items an item may depend on: the files and packages they install.
const SHADCN: Record<string, { files: string[]; dependencies: string[] }> = {
  utils: { files: ['lib/utils.ts'], dependencies: ['clsx', 'tailwind-merge'] },
}
// Provided by any Next.js app the registry installs into.
const HOST = new Set(['react', 'react-dom', 'next'])

function resolveLocal(from: string, spec: string): string {
  const base = spec.startsWith('@/') ? join(root, spec.slice(2)) : resolve(dirname(from), spec)
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) if (existsSync(base + ext) && statSync(base + ext).isFile()) return base + ext
  return base
}

const pkgName = (spec: string) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])

describe.each(registry.items)('registry item $name', (item) => {
  const provided = (item.registryDependencies ?? []).map((d) => SHADCN[d]).filter(Boolean)
  const listed = new Set([...item.files.map((f) => f.path), ...provided.flatMap((p) => p.files)])
  const deps = new Set([...(item.dependencies ?? []), ...provided.flatMap((p) => p.dependencies)])
  const unlisted = new Set<string>()
  const undeclared = new Set<string>()

  const seen = new Set<string>()
  const stack = item.files.map((f) => join(root, f.path))
  while (stack.length) {
    const file = stack.pop()!
    if (seen.has(file) || !existsSync(file)) continue
    seen.add(file)
    // preProcessFile tokenises, so import lines inside template strings (code samples) don't count.
    for (const { fileName: spec } of ts.preProcessFile(readFileSync(file, 'utf8'), true, true).importedFiles) {
      if (spec.startsWith('.') || spec.startsWith('@/')) {
        const target = resolveLocal(file, spec)
        const rel = relative(root, target)
        if (!listed.has(rel)) unlisted.add(`${rel} (imported by ${relative(root, file)})`)
        stack.push(target)
      } else if (!spec.startsWith('node:') && !builtinModules.includes(spec)) {
        const name = pkgName(spec)
        if (!deps.has(name) && !HOST.has(name)) undeclared.add(`${name} (imported by ${relative(root, file)})`)
      }
    }
  }

  it('lists every file it needs, and every listed file exists', () => {
    for (const f of item.files) expect(existsSync(join(root, f.path)), f.path).toBe(true)
    expect([...unlisted]).toEqual([])
  })

  it('declares every package it imports', () => {
    expect([...undeclared]).toEqual([])
  })
})
