import { type editor as Editor } from 'monaco-editor'
import { parseIntoContext } from '../context'
import type { Context, MonacoInstance } from '../types'
import { lifecycle } from './lifecycle'

const modelContexts: WeakMap<Editor.ITextModel, Context> = new WeakMap()

export function observeModelContexts(monaco: MonacoInstance) {
  lifecycle.track(
    monaco.editor.onDidCreateModel(async (model) => {
      const updateContext = async () => modelContexts.set(model, await parseIntoContext(model))
      updateContext()
      lifecycle.trackForModel(model, model.onDidChangeContent(updateContext))
      lifecycle.trackForModel(model, model.onDidChangeLanguage(updateContext))
      lifecycle.trackForModel(model, model.onDidChangeLanguageConfiguration(updateContext))
      console.log('model created', modelContexts)
    }),
  )
}
