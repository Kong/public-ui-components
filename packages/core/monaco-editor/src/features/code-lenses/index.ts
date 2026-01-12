import type { languages } from 'monaco-editor/esm/vs/editor/editor.api.js'

export * from './json'

export function collectCodeLenses(providers: languages.CodeLensProvider[]): languages.CodeLensProvider {
  return {
    provideCodeLenses: async (model, token) => {
      const lenses: languages.CodeLens[] = []
      const disposes: Array<() => void> = []

      for (const provider of providers) {
        const result = await provider.provideCodeLenses(model, token)
        if (!result) return

        lenses.push(...result.lenses)
        disposes.push(result.dispose ?? (() => {}))
      }

      return {
        lenses,
        dispose: () => disposes.forEach((dispose) => dispose()),
      }
    },

    resolveCodeLens: async (model, codeLens, token) => {
      for (const provider of providers) {
        const result = await provider.resolveCodeLens?.(model, codeLens, token)
        if (!result) return

        return result
      }

      return undefined
    },
  }
}
