// Important: do not utilize Vue reactive variables in this composable so that it may be used outside the setup() function
import { Options as IntlMessageFormatOptions } from 'intl-messageformat'
import { createIntl, createIntlCache, MessageDescriptor } from '@formatjs/intl'
import { flatten } from 'flat'
import type { IntlShapeEx, PathToDotNotation, SupportedLocales, MessageFormatPrimitiveValue, IntlConfigCore } from './types'

// this is internal formatJS function that caches instance of Intl and prevent memory leaks
const intlCache = createIntlCache()

// this is global var to hold global (application) instance of Intl
// typed as any since we don't have access to MessageSource here
let globIntl: any

/**
 * Creates and returns global or local instance of Intl
 * @param {SupportedLocales} locale one of the locales supported
 * @param {MessageSource} messages object with locale strings
 * @param {boolean|IntlConfigCore} config to pass additional Intl config parameters or boolean for isGlobal (later is for backwards compatibility)
 *
*/
export const createI18n = <MessageSource extends Record<string, any>>
(locale: SupportedLocales, messages: MessageSource, config: boolean|IntlConfigCore = false): IntlShapeEx<MessageSource> => {

  const intlOriginal = createIntl(
    {
      ...(typeof (config) === 'boolean' ? null : config),
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

  if ((typeof (config) === 'boolean' && config === true) || (typeof (config) !== 'boolean' && config.isGlobal === true)) {
    console.log('!!!!!!!!!!! global')
    globIntl = localIntl
  } else {
    console.log('!!!!!!!!!!! local')
  }

  return localIntl
}

// Returns global (application of Intl)
export default function useI18n<MessageSource extends Record<string, any>>(): IntlShapeEx<MessageSource> {
  return globIntl
}
