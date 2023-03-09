import type { IntlShape as IntlShapeOriginal } from '@formatjs/intl'
import type { Options as IntlMessageFormatOptions } from 'intl-messageformat'

export type MessageFormatPrimitiveValue = string | number | boolean | null | undefined

export type SupportedLocales = 'en-us'

type Dot<T extends string, U extends string> =
  '' extends U ? T : `${T}.${U}`

export type PathToDotNotation<MessageSource, V> = MessageSource extends V ? '' : {
  [K in Extract<keyof MessageSource, string>]: Dot<K, PathToDotNotation<MessageSource[K], V>>
}[Extract<keyof MessageSource, string>]

type IntlShape = Omit<IntlShapeOriginal, '$t'>

type TFunction<T> = (translationKey: PathToDotNotation<T, string>, values?: Record<string, MessageFormatPrimitiveValue> | undefined, opts?: IntlMessageFormatOptions) => string

export type IntlShapeEx<MessageSource = any> = IntlShape & {
  t: TFunction<MessageSource>
  // Override native $t function with our own
  $t: TFunction<MessageSource>
  te: (translationKey: PathToDotNotation<MessageSource, string>) => boolean
  tm: (translationKey: PathToDotNotation<MessageSource, string>) => Array<string>
  source: MessageSource
}
