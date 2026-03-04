import type { editor } from 'monaco-editor'

import type { ModelContext } from '../types'

export async function parseIntoContext(model: editor.ITextModel): Promise<Readonly<ModelContext>> {
  const language = model.getLanguageId()
  const altVersionId = model.getAlternativeVersionId()

  switch (language) {
    case 'json': {
      // Get value before the await boundaries here and elsewhere
      const value = model.getValue()

      const { parseIntoJSONContext } = await import('./json') // Code splitting-friendly
      return parseIntoJSONContext(value, altVersionId)
    }
    case 'yaml': {
      const value = model.getValue()

      const { parseIntoYAMLContext } = await import('./yaml')
      return parseIntoYAMLContext(value, altVersionId)
    }
  }

  return {
    isDefault: true,
    language,
    altVersionId,
  }
}
