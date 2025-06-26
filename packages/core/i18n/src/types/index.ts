import type { IntlShape, IntlConfig } from '@formatjs/intl'

import type { Options as IntlMessageFormatOptions } from 'intl-messageformat'

export type MessageFormatPrimitiveValue = string | number | boolean | null | undefined

export type SupportedLocales = 'en-us'

type Dot<T extends string, U extends string> = '' extends U ? T : `${T}.${U}`

export type PathToDotNotation<MessageSource, V> = MessageSource extends V ? '' : {
  [K in Extract<keyof MessageSource, string>]: Dot<K, PathToDotNotation<MessageSource[K], V>> | K // Allow ending on an incomplete/partial path
}[Extract<keyof MessageSource, string>]

// Omit the native $t function
export type IntlShapeEx<MessageSource extends Record<string, any>> = Omit<IntlShape, '$t'> & {
  formatUnixTimeStamp: (timestamp: number) => string
  formatIsoDate: (isoDate: string) => string
  t: (translationKey: PathToDotNotation<MessageSource, string>, values?: Record<string, MessageFormatPrimitiveValue> | undefined, opts?: IntlMessageFormatOptions) => string
  te: (translationKey: PathToDotNotation<MessageSource, string>) => boolean
  tm: (translationKey: PathToDotNotation<MessageSource, string>) => string[]
  source: MessageSource
}

// ommit locale and messages as we are passing those in separate parameters into createI18n fn
export interface IntlConfigCore extends Omit<IntlConfig, 'messages' | 'locale' > {
  isGlobal: boolean
}
