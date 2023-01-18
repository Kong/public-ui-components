import type { IntlShape } from '@formatjs/intl'
import type { Options as IntlMessageFormatOptions } from 'intl-messageformat'


export type MessageFormatPrimitiveValue = string | number | boolean | null | undefined

export type SupportedLocales = 'en-us'

export type IntlShapeEx = IntlShape & {
  t: (translationKey: string, values?: Record<string, MessageFormatPrimitiveValue> | undefined, opts?: IntlMessageFormatOptions) => string,
  te: (translationKey: string) => boolean,
  tm: (translationKey: string) => Array<string>,
  source: Record<string, any>,
}
