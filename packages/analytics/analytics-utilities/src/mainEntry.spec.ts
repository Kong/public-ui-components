// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { build } from 'vite'
import type { OutputChunk, RollupOutput } from 'rollup'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(fileURLToPath(import.meta.url), '../..')

// Returns every module the chunk loads at runtime: its own static imports, plus those of any chunks it imports.
const collectRuntimeImports = (entry: OutputChunk, chunks: Map<string, OutputChunk>): Set<string> => {
  const seen = new Set<string>()
  const queue = [entry.fileName]
  while (queue.length) {
    const chunk = chunks.get(queue.pop()!)
    if (!chunk) continue
    for (const id of chunk.imports) {
      if (!seen.has(id)) {
        seen.add(id)
        queue.push(id)
      }
    }
  }
  return seen
}

describe('package entry points', () => {
  // The main entry must stay free of `vue` so consumers that only need constants/utilities don't have to install it.
  // Anything that needs `vue` belongs in `src/coordination`.
  it('main entry does not import vue at runtime in any output format', async () => {
    const result = await build({
      root: packageRoot,
      configFile: resolve(packageRoot, 'vite.config.ts'),
      mode: 'production',
      logLevel: 'silent',
      build: { write: false },
    }) as RollupOutput[]

    expect(result.length).toBeGreaterThan(0)

    for (const { output } of result) {
      const chunks = new Map(output.filter((o): o is OutputChunk => o.type === 'chunk').map((c) => [c.fileName, c]))
      const main = [...chunks.values()].find((c) => c.isEntry && c.name === 'main')

      expect(main, 'main entry chunk should exist').toBeDefined()
      expect([...collectRuntimeImports(main!, chunks)]).not.toContain('vue')
    }
  }, 60_000)
})
