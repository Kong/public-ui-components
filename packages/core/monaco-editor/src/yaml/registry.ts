import type * as monaco from 'monaco-editor'
import type {
  JsonSchema,
  YamlCompletionExtension,
  YamlCompletionOptions,
  YamlStyleOptions,
} from './types'

export type YamlModelConfig = {
  schema: JsonSchema
  yamlVersion: '1.1'
  completion: Required<YamlCompletionOptions>
  style: YamlStyleOptions
  extensions: YamlCompletionExtension[]
}

const modelRegistry = new Map<string, YamlModelConfig>()
const editorRegistry = new Map<string, monaco.editor.IStandaloneCodeEditor>()

export function setModelConfig(model: monaco.editor.ITextModel, config: YamlModelConfig) {
  modelRegistry.set(model.uri.toString(), config)
}

export function getModelConfig(model: monaco.editor.ITextModel): YamlModelConfig | null {
  return modelRegistry.get(model.uri.toString()) ?? null
}

export function deleteModelConfig(model: monaco.editor.ITextModel) {
  modelRegistry.delete(model.uri.toString())
}

export function setModelEditor(
  model: monaco.editor.ITextModel,
  editor: monaco.editor.IStandaloneCodeEditor,
) {
  editorRegistry.set(model.uri.toString(), editor)
}

export function getModelEditor(modelUri: string): monaco.editor.IStandaloneCodeEditor | null {
  return editorRegistry.get(modelUri) ?? null
}

export function deleteModelEditor(model: monaco.editor.ITextModel) {
  editorRegistry.delete(model.uri.toString())
}
