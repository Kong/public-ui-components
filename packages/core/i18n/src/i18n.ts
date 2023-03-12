// Important: do not utilize Vue reactive variables in this composable so that it may be used outside the setup() function
import { Options as IntlMessageFormatOptions } from 'intl-messageformat'
import { createIntl, createIntlCache, MessageDescriptor } from '@formatjs/intl'
import { flatten } from 'flat'
import type { IntlShapeEx, PathToDotNotation, SupportedLocales, MessageFormatPrimitiveValue } from './types'

// this is internal formatJS function that caches instance of Intl and prevent memory leaks
const intlCache = createIntlCache()

// this is global var to hold global (application) instance of Intl
// typed as any since we don't have access to MessageSource here
let globIntl: any

export const createI18n = <MessageSource = Record<string, any>>(locale: SupportedLocales, messages: MessageSource, isGlobal: boolean = false): IntlShapeEx<MessageSource> => {
  const intlOriginal = createIntl(
    {
      locale,
      messages: flatten(messages, {
        safe: true, // Preserve arrays
      }),
    },
    intlCache,
  )

  // Remove the native $t function from intlOriginal
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $t, ...otherProps } = intlOriginal
  const intl = otherProps

  const t = (translationKey: PathToDotNotation<MessageSource, string>, values?: Record<string, MessageFormatPrimitiveValue> | undefined, opts?: IntlMessageFormatOptions): string => {
    return intl.formatMessage(<MessageDescriptor>{ id: translationKey }, values, opts)
  }

  const te = (translationKey: PathToDotNotation<MessageSource, string>): boolean => {
    return !!intl.messages[translationKey]
  }

  const tm = (translationKey: PathToDotNotation<MessageSource, string>): Array<string> => {
    // @ts-ignore
    return intl.messages[translationKey] || []
  }

  const localIntl: IntlShapeEx<MessageSource> = {
    t,
    te,
    tm,
    ...intl,
    source: messages,
  }

  if (isGlobal) {
    globIntl = localIntl
  }

  return localIntl
}

// this returns global (application of Intl)
export default function useI18n<MessageSource = Record<string, any>>(): IntlShapeEx<MessageSource> {
  return globIntl
}
