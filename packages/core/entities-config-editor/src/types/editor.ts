export const EDITOR_LANGUAGES = {
  JSON: 'json',
} as const

export type EditorLanguage = typeof EDITOR_LANGUAGES[keyof typeof EDITOR_LANGUAGES]

export interface EditingEntity {
  kind: string
  identifier?: string
}
