import type * as monaco from 'monaco-editor'
import { getYamlDoc } from './doc-cache'
import { getCursorContext } from './context'
import { provideYamlCompletions } from './completion'
import { registerYamlSmartEdits } from './smart-edits'
import { ensureYamlSuggestCommand } from './suggest'
import {
  deleteModelConfig,
  deleteModelEditor,
  getModelConfig,
  setModelConfig,
  setModelEditor,
} from './registry'
import type {
  AttachYamlJsonSchemaOptions,
  YamlCompletionOptions,
  YamlStyleOptions,
} from './types'

const DEFAULT_COMPLETION_OPTIONS: Required<YamlCompletionOptions> = {
  enabled: true,
  triggerOnAccept: true,
  triggerOnEnter: true,
  triggerOnColon: true,
  hideSchemaTemplates: true,
  discriminatedUnion: 'intersection-until-narrowed',
  includeNullValue: false,
  suggestAdditionalPropertiesKey: true,
}

const DEFAULT_STYLE: Required<YamlStyleOptions> = {
  arrayItemStyle: 'indentless',
}

let completionProvider: monaco.IDisposable | null = null

function ensureCompletionProvider(monacoApi: typeof monaco) {
  if (completionProvider) return
  if (!monacoApi.languages.getLanguages().some((lang) => lang.id === 'yaml')) {
    monacoApi.languages.register({ id: 'yaml' })
  }
  completionProvider = monacoApi.languages.registerCompletionItemProvider('yaml', {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position) {
      const config = getModelConfig(model)
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

  setModelConfig(model, {
    schema: options.schema,
    yamlVersion,
    completion,
    style,
    extensions,
  })
  setModelEditor(model, editor)

  ensureCompletionProvider(monacoApi)
  ensureYamlSuggestCommand(monacoApi)

  const smartEditsDisposable = registerYamlSmartEdits(monacoApi, editor)

  return {
    dispose: () => {
      smartEditsDisposable.dispose()
      deleteModelEditor(model)
      deleteModelConfig(model)
    },
  }
}

export * from './types'
