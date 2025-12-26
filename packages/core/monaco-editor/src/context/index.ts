import type { editor } from 'monaco-editor'
import type { Context } from '../types'

export async function parseIntoContext(model: editor.ITextModel): Promise<Context> {
  switch (model.getLanguageId()) {
    case 'json': {
      const { parseIntoJSONContext } = await import('./json')
      return parseIntoJSONContext(model)
    }
    default: {
      return {
        language: model.getLanguageId(),
        model,
      }
    }
  }
}
