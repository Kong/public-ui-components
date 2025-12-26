import type { editor } from 'monaco-editor'
import type { JSONContext } from '../types'
import { parseTree } from 'jsonc-parser'

export async function parseIntoJSONContext(model: editor.ITextModel): Promise<JSONContext> {
  const modelValue = model.getValue()
  const root = parseTree(modelValue)

  return {
    language: 'json',
    model,
    root,
  }
}
