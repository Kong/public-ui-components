import type { Plugin } from 'vite'
import type {
  EditorFeature,
  EditorLanguage,
  NegatedEditorFeature,
  IFeatureDefinition,
} from 'monaco-editor/esm/metadata.js'
import type { BundledLanguage, BundledTheme } from 'shiki'

import { features, languages } from 'monaco-editor/esm/metadata.js'
import { codegen } from 'shiki-codegen'
import { bundledLanguages } from 'shiki'

type Options = {
  /**
   * Include only a subset of the languages supported.
   *
   * @type {EditorLanguage[]}
   * @defaultValue All languages shipped with monaco-editor
   * @example
   * ```ts
   * // Only include JavaScript and JSON support
   * languages: ['javascript', 'json']
   * ```
   */
  languages?: EditorLanguage[]

  /**
   * Custom languages (outside of the ones shipped with the `monaco-editor`).
   * Use this to add support for languages not included in monaco-editor by default.
   *
   * @type {IFeatureDefinition[]}
   * @example
   * ```ts
   * // Add yaml support from `monaco-yaml`
   * customLanguages: [
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
   * Prefix a feature with `!` to exclude it instead.
   *
   * @type {Array<EditorFeature | NegatedEditorFeature>}
   * @defaultValue All features shipped with monaco-editor
   * @example
   * ```ts
   * // Exclude context menu and find features
   * features: ['!contextmenu', '!find']
   *
   * // Or only include specific features
   * features: ['coreCommands', 'coreActions']
   * ```
   */
  features?: Array<EditorFeature | NegatedEditorFeature>

  /**
 * Shiki configuration options.
 * @type {{ themes?: BundledTheme[]; langs?: BundledLanguage[] }}
 */
  shiki?: {
    /**
    * Languages to include for Shiki syntax highlighting.
    *
    * @type {BundledLanguage[]}
    * @defaultValue The same languages specified in the`languages` option above
    * @example
    * ```ts
    * // Only include JavaScript and JSON support
    * langs: ['javascript', 'json']
    * ```
    */
    langs?: BundledLanguage[]

    /**
     * Themes to include for Shiki syntax highlighting.
     *
     * @type {BundledTheme[]}
     * @defaultValue ['catppuccin-latte', 'catppuccin-mocha']
     * @example
     * ```ts
     * // Include the 'nord' theme
     * themes: ['nord']
     * ```
     */
    themes?: BundledTheme[]
  }
}

// Some languages share the same worker; define aliases here
const WORKER_ALIASES: Record<string, string> = {
  javascript: 'typescript',
  less: 'css',
  scss: 'css',
  handlebars: 'html',
  razor: 'html',
}

const VIRTUAL_MODULE_MONACO_ID = '\0virtual:monaco-editor'
const VIRTUAL_MODULE_SHIKI_ID = '\0virtual:shiki'

// Generate import statements for Monaco Editor feature entries
function generateImports(entries: string | string[]): string[] {
  const entryArray = Array.isArray(entries) ? entries : [entries]
  return entryArray.map((entry) => {
    // Start from monaco v0.55.1, languages with monaco.contribution needed to be reexported
    // https://github.com/microsoft/monaco-editor/issues/5133
    if (entry.endsWith('monaco.contribution')) {
      const lang = entry.split('/').at(-2)!
      return `export * as ${lang} from 'monaco-editor/esm/${entry}'`
    }
    return `import 'monaco-editor/esm/${entry}'`
  })
}

// Resolve which editor features to include based on user options
// Supports both inclusion (explicit list) and exclusion (prefixed with '!') patterns
function resolveFeatures(
  requestedFeatures: Options['features'],
  allFeatureIds: EditorFeature[],
): EditorFeature[] {
  if (!requestedFeatures) {
    return allFeatureIds
  }

  const excludedFeatures = requestedFeatures
    .filter((f): f is NegatedEditorFeature => f.startsWith('!'))
    .map((f) => f.slice(1)) as EditorFeature[]

  if (excludedFeatures.length) {
    return allFeatureIds.filter((f) => !excludedFeatures.includes(f))
  }

  return requestedFeatures as EditorFeature[]
}

// Generate complete web worker setup code for Monaco Editor
// Handles worker imports, MonacoEnvironment setup for both built-in and custom languages
function generateWorkerCode(
  languageIds: string[],
  languagesDict: Record<string, IFeatureDefinition>,
  customLanguages?: IFeatureDefinition[],
): string[] {
  const importedWorkers = new Set<string>()
  const imports: string[] = []
  const workerMapEntries: string[] = []

  // Add base editor worker import
  imports.push("import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'")

  // Generate imports and worker map entries for base languages
  languageIds.forEach((langId) => {
    // Resolve the actual language to use for the worker (handle aliases)
    const actualLang = WORKER_ALIASES[langId] || langId
    const lang = languagesDict[actualLang]
    const workerEntry = lang?.worker?.entry

    if (!workerEntry) {
      return
    }
    const workerVar = `${actualLang}Worker`
    if (!importedWorkers.has(workerVar)) {
      imports.push(
        `import ${workerVar} from 'monaco-editor/esm/${workerEntry}?worker'`,
      )
      importedWorkers.add(workerVar)
    }
    workerMapEntries.push(`  ${langId}: ${workerVar},`)
  })

  // Generate imports and worker map entries for custom languages
  if (customLanguages) {
    customLanguages
      .filter(({ worker }) => worker?.entry)
      .forEach(({ label, worker }) => {
        const workerVar = `${label}Worker`
        imports.push(`import ${workerVar} from '${worker!.entry}?worker'`)
        workerMapEntries.push(`  ${label}: ${workerVar},`)
      })
  }

  // Build the complete worker setup code
  return [
    ...imports,
    '',
    'const workerMap = {',
    ...workerMapEntries,
    '}',
    '',
    'self.MonacoEnvironment = {',
    '  getWorker(_, label) {',
    '    const Worker = workerMap[label] || EditorWorker',
    '    return new Worker()',
    '  },',
    '}',
  ]
}

export default function plugin(options?: Options): Plugin {
  return {
    name: 'vite-plugin-monaco',
    enforce: 'pre',

    resolveId(id) {
      if (id === 'monaco-editor') {
        return VIRTUAL_MODULE_MONACO_ID
      } else if (id === 'shiki') {
        return VIRTUAL_MODULE_SHIKI_ID
      }
    },

    load(id) {
      if (id === VIRTUAL_MODULE_MONACO_ID) {
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

        const workerCode = generateWorkerCode(
          languageIds,
          languagesDict,
          options?.customLanguages,
        )

        return [
          "import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'",
          ...featureImports,
          ...languageImports,
          ...customLanguageImports,
          ...workerCode,
          "export * from 'monaco-editor/esm/vs/editor/editor.api'",
          'export default monaco',
        ].join('\n')
      } else if (id === VIRTUAL_MODULE_SHIKI_ID) {
        const languageIds =
          options?.shiki?.langs ||
          (options?.languages || languages.map((lang) => lang.label))
            // Only include languages that are bundled with shiki
            .filter((lang): lang is BundledLanguage => lang in bundledLanguages)

        return codegen({
          themes: options?.shiki?.themes || ['catppuccin-latte', 'catppuccin-mocha'],
          engine: 'javascript',
          langs: languageIds,
          typescript: false,
        })
      }
    },
  }
}
