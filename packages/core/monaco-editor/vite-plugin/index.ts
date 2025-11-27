import type { Plugin } from 'vite'
import type {
  EditorFeature,
  EditorLanguage,
  NegatedEditorFeature,
  IFeatureDefinition,
} from 'monaco-editor/esm/metadata.js'
import { features, languages } from 'monaco-editor/esm/metadata.js'

type Options = {
  /**
   * Include only a subset of the languages supported.
   * By default, all languages shipped with the `monaco-editor` will be included.
   */
  languages?: EditorLanguage[]

  /**
   * Custom languages (outside of the ones shipped with the `monaco-editor`).
   * @example
   * ```ts
   * // Add yaml support from `monaco-yaml`
   * [
   *   {
   *     label: 'yaml',
   *     entry: 'monaco-yaml',
   *     worker: {
   *       id: 'monaco-yaml/yamlWorker',
   *       entry: 'monaco-yaml/yaml.worker',
   *     },
   *   },
   * ]
   * ```
   */
  customLanguages?: IFeatureDefinition[]

  /**
   * Include only a subset of the editor features.
   * By default, all features shipped with the `monaco-editor` will be included.
   * Use e.g. '!contextmenu' to exclude a certain feature.
   */
  features?: Array<EditorFeature | NegatedEditorFeature>
}

// Some languages share the same worker; define aliases here
const WORKER_ALIASES: Record<string, string> = {
  javascript: 'typescript',
  less: 'css',
  scss: 'css',
  handlebars: 'html',
  razor: 'html',
}

const VIRTUAL_MODULE_ID = '\0virtual:monaco-editor'

function generateImports(entries: string | string[]): string[] {
  const entryArray = Array.isArray(entries) ? entries : [entries]
  return entryArray.map((entry) => `import 'monaco-editor/esm/${entry}'`)
}

function resolveFeatures(
  requestedFeatures: Options['features'],
  allFeatureIds: EditorFeature[],
) {
  if (!requestedFeatures) {
    return allFeatureIds
  }

  const excludedFeatures = requestedFeatures
    .filter((f): f is NegatedEditorFeature => f.startsWith('!'))
    .map((f) => f.slice(1)) as EditorFeature[]

  if (excludedFeatures.length > 0) {
    return allFeatureIds.filter((f) => !excludedFeatures.includes(f))
  }

  return requestedFeatures as EditorFeature[]
}

function generateWorkerCode(
  languageIds: string[],
  workerPaths: Record<string, string>,
  customLanguages?: IFeatureDefinition[],
): { imports: string[], assignments: string[] } {
  const importedWorkers = new Set<string>()

  const baseWorkers = languageIds.reduce(
    (acc, langId) => {
      // Resolve the actual language to use for the worker (handle aliases)
      const actualLang = WORKER_ALIASES[langId] || langId
      const workerEntry = workerPaths[actualLang]

      if (!workerEntry) {
        return acc
      }
      const workerVar = `${actualLang}Worker`
      if (!importedWorkers.has(workerVar)) {
        acc.imports.push(
          `import ${workerVar} from 'monaco-editor/esm/${workerEntry}?worker'`,
        )
        importedWorkers.add(workerVar)
      }
      acc.assignments.push(`workers['${langId}'] ??= ${workerVar}`)
      return acc
    },
    { imports: [] as string[], assignments: [] as string[] },
  )

  if (!customLanguages) {
    return baseWorkers
  }

  return customLanguages
    .filter(({ worker }) => worker?.entry)
    .reduce((acc, { label, worker }) => {
      const workerVar = `${label}Worker`
      acc.imports.push(`import ${workerVar} from '${worker!.entry}?worker'`)
      acc.assignments.push(`workers['${label}'] ??= ${workerVar}`)
      return acc
    }, baseWorkers)
}

export default function(options?: Options): Plugin {
  return {
    name: 'vite-plugin-monaco',
    enforce: 'pre',

    resolveId(id) {
      if (id === 'monaco-editor') {
        return VIRTUAL_MODULE_ID
      }
    },

    load(id) {
      if (id !== VIRTUAL_MODULE_ID) {
        return
      }

      const languagesDict = Object.fromEntries(
        languages.map((lang) => [lang.label, lang]),
      )

      const featuresDict = Object.fromEntries(
        features.map((feat) => [feat.label, feat]),
      )

      const featuresIds = resolveFeatures(
        options?.features,
        Object.keys(featuresDict) as EditorFeature[],
      )

      const featureImports = featuresIds.flatMap((featureId) => {
        const feature = featuresDict[featureId]
        if (!feature?.entry) {
          return []
        }
        return generateImports(feature.entry)
      })

      const languageIds =
        options?.languages || (Object.keys(languagesDict) as EditorLanguage[])

      const languageImports = languageIds.flatMap((langId) => {
        const lang = languagesDict[langId]
        if (!lang?.entry) {
          return []
        }
        return generateImports(lang.entry)
      })

      const customLanguageImports = (options?.customLanguages || []).map(
        ({ entry }) => `import '${entry}'`,
      )

      const workerPaths = languages.reduce(
        (acc, lang) => {
          if (lang.worker?.entry) {
            acc[lang.label] = lang.worker.entry
          }
          return acc
        },
        {} as Record<string, string>,
      )
      const { imports: workerImports, assignments: workerAssignments } =
        generateWorkerCode(languageIds, workerPaths, options?.customLanguages)

      const globalWorkerSetup = [
        "import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'",
        'self.MonacoEnvironment ??= {',
        '  _workers: {},',
        '  getWorker: function (_, label) {',
        '    const worker = this._workers[label] ?? EditorWorker',
        '    return new worker()',
        '  },',
        '}',
        'const workers = self.MonacoEnvironment._workers',
      ].join('\n')

      return [
        "import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'",
        ...featureImports,
        ...languageImports,
        ...customLanguageImports,
        ...workerImports,
        globalWorkerSetup,
        ...workerAssignments,
        "export * from 'monaco-editor/esm/vs/editor/editor.api'",
        'export default monaco',
      ].join('\n')
    },
  }
}
