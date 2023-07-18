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

  /**
   * Formats a unix timestamp into a formatted date string
   * @param {Number} timestamp a unix timestamp in seconds
   * @returns a date string formatted like 'Apr 6, 2022 10:50'
   */
  const formatUnixTimeStamp = (timestamp: number): string => {
    const invalidDate = 'Invalid Date'
    if (!timestamp) {
      return invalidDate
    }

    try {
      const date = new Date(timestamp * 1000)

      return intl.formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
    } catch (err) {
      return invalidDate
    }
  }

  /**
   * Format an ISO fomatted date
   * @param {String} isoDate ISO formatted date string
   * @returns {String} date formatted like 'Apr 6, 2022 10:50'
   */
  const formatIsoDate = (isoDate: string): string => {
    const date = Date.parse(isoDate) / 1000

    return formatUnixTimeStamp(date)
  }

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
    formatUnixTimeStamp,
    formatIsoDate,
    t,
    te,
    tm,
    ...intl,
    source: messages,
  }

  if ((typeof (config) === 'boolean' && config === true) || (typeof (config) !== 'boolean' && config.isGlobal === true)) {
    globIntl = localIntl
  }

  return localIntl
}

// Returns global (application of Intl)
export default function useI18n<MessageSource extends Record<string, any>>(): IntlShapeEx<MessageSource> {
  return globIntl
}
