import type { IntlShapeEx } from '@kong-ui-public/i18n'
import type english from '../locales/en.json'

type I18n = Pick<IntlShapeEx<typeof english>, 't' | 'te'>

export interface FieldLabelOptions {
  // i18n prefix; defaults to 'chartLabels'
  prefix?: string

  // What to return if neither the config store nor i18n has the key
  fallback?: string
}

/**
 * Resolves a field name to a translated label by querying the config store and falling back to i18n.
 */
export const fieldLabel = (
  i18n: I18n,
  fieldTranslationMap: Map<string, string>,
  key: string,
  { prefix = 'chartLabels', fallback = key }: FieldLabelOptions = {},
): string => {
  const translationKey = `${prefix}.${key}` as any

  return fieldTranslationMap.get(key)
    || (i18n.te(translationKey) ? i18n.t(translationKey) : fallback)
}
