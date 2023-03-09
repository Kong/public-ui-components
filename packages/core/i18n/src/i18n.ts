// Important: do not utilize Vue reactive variables in this composable so that it may be used outside the setup() function
import { Options as IntlMessageFormatOptions } from 'intl-messageformat'
import { createIntl, createIntlCache, MessageDescriptor } from '@formatjs/intl'
import { flatten } from 'flat'
import type { IntlShapeEx, SupportedLocales, MessageFormatPrimitiveValue } from './types'

// this is internal formatJS function that caches instance of Intl and prevent memory leaks
const intlCache = createIntlCache()

// this is global var to hold global (application) instance of Intl
let globIntl: IntlShapeEx

export const createI18n = <MessageSource>(locale: SupportedLocales, messages: MessageSource, isGlobal: boolean = false): IntlShapeEx<MessageSource> => {
  const intl = createIntl(
    {
      locale,
      messages: flatten(messages, {
        safe: true, // Preserve arrays
      }),
    },
    intlCache,
  )

  const t = (translationKey: string, values?: Record<string, MessageFormatPrimitiveValue> | undefined, opts?: IntlMessageFormatOptions): string => {
    return intl.formatMessage(<MessageDescriptor>{ id: translationKey }, values, opts)
  }

  const te = (key: string): boolean => {
    return !!intl.messages[key]
  }

  const tm = (key: string): Array<string> => {
    // @ts-ignore
    return intl.messages[key] || []
  }

  const localIntl = {
    t,
    te,
    tm,
    ...intl,
    $t: t, // override the default $t with our function
    source: messages,
  }

  if (isGlobal) {
    globIntl = localIntl
  }

  return localIntl
}

// this returns global (application of Intl)
export default function useI18n<MessageSource>(): IntlShapeEx<MessageSource> {
  return globIntl
}
