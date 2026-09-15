import * as monaco from 'monaco-editor'
import type { EditorThemes } from '../types'

// Map a light/dark theme preference to the corresponding Shiki-registered Monaco theme id.
export function getMonacoTheme(theme: EditorThemes): string {
  return theme === 'light' ? 'catppuccin-latte' : 'material-theme-darker'
}

/**
 * Create a Monaco text model, or update an existing one's value in place.
 *
 * Models are created (not recreated) on first setup and reused across re-entries
 * (e.g. a `v-if` toggle of the target element)
 *
 * @param existing - The current model, if one already exists for this slot.
 * @param value - The content to set on the model.
 * @param language - The language id for the model.
 * @param uriSegment - An optional path segment to distinguish this model's URI from
 *   others created in the same session (e.g. `'diff-original'`/`'diff-modified'`).
 *   Omit for a single-model editor.
 */
export function createOrUpdateModel(
  existing: monaco.editor.ITextModel | undefined,
  value: string,
  language: string,
  uriSegment?: string,
): monaco.editor.ITextModel {
  if (existing) {
    existing.setValue(value)
    return existing
  }

  const path = uriSegment ? `${uriSegment}/${language}` : language
  const uri = monaco.Uri.parse(`inmemory://model/${path}-${crypto.randomUUID()}`)
  return monaco.editor.createModel(value, language, uri)
}
