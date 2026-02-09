import type * as monaco from 'monaco-editor'
import { getYamlDoc } from './doc-cache'
import { getCursorContext } from './context'
import { provideYamlCompletions } from './completion'
import { getModelConfig, getModelEditor } from './registry'
import { YAML_SUGGEST_COMMAND_ID } from './constants'

export function triggerSuggestIfAvailable(
  monacoApi: typeof monaco,
  editor: monaco.editor.IStandaloneCodeEditor,
  positionOverride?: monaco.Position,
) {
  const model = editor.getModel()
  if (!model) return
  const config = getModelConfig(model)
  if (!config || !config.completion.enabled) return

  const position = positionOverride ?? editor.getPosition()
  if (!position) return

  const doc = getYamlDoc(model, config.yamlVersion)
  const ctx = getCursorContext(model, position, doc)
  const completions = provideYamlCompletions(
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

  if (completions.suggestions.length === 0) {
    return
  }

  editor.trigger('yaml-smart-edit', 'editor.action.triggerSuggest', null)
}

let suggestCommandDisposable: monaco.IDisposable | null = null

export function ensureYamlSuggestCommand(monacoApi: typeof monaco) {
  if (suggestCommandDisposable) return
  suggestCommandDisposable = monacoApi.editor.registerCommand(
    YAML_SUGGEST_COMMAND_ID,
    (_accessor, modelUri?: string) => {
      if (typeof modelUri !== 'string') return
      const editor = getModelEditor(modelUri)
      if (!editor) return
      triggerSuggestIfAvailable(monacoApi, editor)
    },
  )
}
