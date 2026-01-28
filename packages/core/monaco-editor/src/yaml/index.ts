import type * as monaco from 'monaco-editor'
import { getYamlDoc } from './doc-cache'
import { getCursorContext } from './context'
import { provideYamlCompletions } from './completion'
import { registerYamlSmartEdits } from './smart-edits'
import type {
  AttachYamlJsonSchemaOptions,
  JsonSchema,
  YamlCompletionOptions,
  YamlCompletionExtension,
  YamlStyleOptions,
} from './types'

type ModelConfig = {
  schema: JsonSchema
  yamlVersion: '1.1'
  completion: Required<YamlCompletionOptions>
  style: YamlStyleOptions
  extensions: YamlCompletionExtension[]
}

const DEFAULT_COMPLETION_OPTIONS: Required<YamlCompletionOptions> = {
  enabled: true,
  triggerOnAccept: true,
  triggerOnEnter: true,
  triggerOnColon: true,
  hideSchemaTemplates: true,
  discriminatedUnion: 'intersection-until-narrowed',
}

const DEFAULT_STYLE: Required<YamlStyleOptions> = {
  arrayItemStyle: 'indentless',
}

const modelRegistry = new Map<string, ModelConfig>()
let completionProvider: monaco.IDisposable | null = null

function ensureCompletionProvider(monacoApi: typeof monaco) {
  if (completionProvider) return
  if (!monacoApi.languages.getLanguages().some((lang) => lang.id === 'yaml')) {
    monacoApi.languages.register({ id: 'yaml' })
  }
  completionProvider = monacoApi.languages.registerCompletionItemProvider('yaml', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const config = modelRegistry.get(model.uri.toString())
      if (!config) {
        return { suggestions: [] }
      }

      const doc = getYamlDoc(model, config.yamlVersion)
      const ctx = getCursorContext(model, position, doc)

      return provideYamlCompletions(
        monacoApi,
        model,
        position,
        ctx,
        config.schema,
        doc.data,
        doc.doc,
        config.completion,
        config.style,
        config.extensions,
      )
    },
  })
}

export function attachYamlJsonSchema(
  monacoApi: typeof monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  options: AttachYamlJsonSchemaOptions,
): monaco.IDisposable {
  const model = editor.getModel()
  if (!model) {
    return { dispose: () => {} }
  }

  const yamlVersion = options.yamlVersion ?? '1.1'
  const completion = { ...DEFAULT_COMPLETION_OPTIONS, ...options.completion }
  const style = { ...DEFAULT_STYLE, ...options.style }
  const extensions = options.extensions ?? []

  modelRegistry.set(model.uri.toString(), {
    schema: options.schema,
    yamlVersion,
    completion,
    style,
    extensions,
  })

  ensureCompletionProvider(monacoApi)

  const smartEditsDisposable = registerYamlSmartEdits(
    monacoApi,
    editor,
    options.schema,
    yamlVersion,
    completion,
    style,
  )

  return {
    dispose: () => {
      smartEditsDisposable.dispose()
      modelRegistry.delete(model.uri.toString())
    },
  }
}

export * from './types'
