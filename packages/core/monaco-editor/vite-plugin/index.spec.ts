import { describe, it, expect } from 'vitest'
import { build } from 'vite'
import type { Plugin, RollupOutput } from 'rollup'
import monacoPlugin from './index'

// Virtual entry plugin that provides a test module importing monaco-editor
const virtualEntryPlugin = (): Plugin => {
  const virtualModuleId = 'virtual:entry'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'virtual-entry',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return 'import * as monaco from "monaco-editor"'
      }
    },
  }
}


describe('vite-plugin-monaco', () => {
  const getGeneratedCode = async (options?: Parameters<typeof monacoPlugin>[0]) => {
    const { output: [{ code }] } = await build({
      plugins: [monacoPlugin(options), virtualEntryPlugin()],
      build: {
        // Keep code untransformed for stable, readable snapshots that don't change with Vite versions
        target: 'esnext',
        rollupOptions: {
          input: ['virtual:entry'],
          external: [
            // External all monaco-editor submodules while keeping the main import for vite-plugin to resolve
            /^monaco-editor\/.+/,
            /^monaco-yaml/,
          ],
        },
        minify: false,
        write: false,
      },
      configFile: false,
      logLevel: 'silent',
    }) as RollupOutput

    return code
  }

  describe('generated code snapshots', () => {
    it('should include all features with default configuration', async () => {
      const code = await getGeneratedCode()
      expect(code).toMatchSnapshot()
    })

    it('should generate code with specific languages', async () => {
      const code = await getGeneratedCode({
        features: [],
        languages: ['javascript', 'typescript', 'json'],
      })
      expect(code).toMatchSnapshot()
    })

    it('should generate code with specific features', async () => {
      const code = await getGeneratedCode({
        features: ['contextmenu', 'find'],
        languages: [],
      })
      expect(code).toMatchSnapshot()
    })

    it('should generate code with excluded features', async () => {
      const code = await getGeneratedCode({
        features: ['!contextmenu', '!find'],
        languages: [],
      })
      expect(code).toMatchSnapshot()
    })

    it('should generate code with custom languages', async () => {
      const code = await getGeneratedCode({
        customLanguages: [
          {
            label: 'yaml',
            entry: 'monaco-yaml',
            worker: {
              id: 'monaco-yaml/yamlWorker',
              entry: 'monaco-yaml/yaml.worker',
            },
          },
        ],
      })
      expect(code).toMatchSnapshot()
    })

    it('should generate code with combined options', async () => {
      const code = await getGeneratedCode({
        languages: ['javascript', 'json'],
        features: ['contextmenu'],
        customLanguages: [
          {
            label: 'yaml',
            entry: 'monaco-yaml',
            worker: {
              id: 'monaco-yaml/yamlWorker',
              entry: 'monaco-yaml/yaml.worker',
            },
          },
        ],
      })
      expect(code).toMatchSnapshot()
    })
  })

  describe('optimizeDeps config', () => {
    const getOptimizeDeps = (options?: Parameters<typeof monacoPlugin>[0]) => {
      const plugin = monacoPlugin(options)
      const configHook = plugin.config as (config: unknown, env: unknown) => { optimizeDeps: { include: string[], exclude: string[] } }
      return configHook.call(plugin, {}, { command: 'serve', mode: 'development' }).optimizeDeps
    }

    it('excludes monaco-editor/shiki so imports of them keep hitting resolveId', () => {
      const { exclude } = getOptimizeDeps()
      expect(exclude).toEqual(['monaco-editor', 'shiki'])
    })

    it('includes only plain-JS deep specifiers, not worker or css imports', () => {
      const { include } = getOptimizeDeps({ languages: ['json'], features: ['find'] })

      expect(include).toContain('monaco-editor/esm/vs/editor/editor.api')
      expect(include.some((id) => id.includes('?'))).toBe(false)
      expect(include.some((id) => id.endsWith('.css'))).toBe(false)
    })

    it('excludes a feature that only ships a .css entry, without erroring', () => {
      // `codicon` is the only default feature whose entries are all `.css` (no `.js` at all) —
      // makes sure filtering those out doesn't blow up or leave a `.css` specifier behind
      const { include } = getOptimizeDeps({ languages: [], features: ['codicon'] })

      // Only the always-present core editor entry point remains — codicon itself contributed
      // nothing, since all of its entries are `.css` and got filtered out
      expect(include).toEqual(['monaco-editor/esm/vs/editor/editor.api'])
    })
  })
})
