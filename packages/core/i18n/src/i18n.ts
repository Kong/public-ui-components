// Important: do not utilize Vue reactive variables in this composable so that it may be used outside the setup() function
import type { Options as IntlMessageFormatOptions } from 'intl-messageformat'
import type { MessageDescriptor } from '@formatjs/intl'
import { createIntl, createIntlCache } from '@formatjs/intl'
import { flatten } from 'flat'
import type { IntlShapeEx, PathToDotNotation, SupportedLocales, MessageFormatPrimitiveValue, IntlConfigCore } from './types'

// this is internal formatJS function that caches instance of Intl and prevent memory leaks
const intlCache = createIntlCache()

// this is global var to hold global (application) instance of Intl
// typed as any since we don't have access to MessageSource here
let globIntl: any
const datetimeFormat: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}
/**
 * Creates and returns global or local instance of Intl
 * @param {SupportedLocales} locale one of the locales supported
 * @param {MessageSource} messages object with locale strings
 * @param {boolean|IntlConfigCore} config to pass additional Intl config parameters or boolean for isGlobal (later is for backwards compatibility)
 *
*/
export const createI18n = <MessageSource extends Record<string, any>>
(locale: SupportedLocales, messages: MessageSource, config: boolean | IntlConfigCore = false): IntlShapeEx<MessageSource> => {

  const booleanConfig = typeof (config) === 'boolean'
  const intlOriginal = createIntl(
    {
      ...(booleanConfig ? null : config),
      locale,
      messages: flatten(messages, {
        safe: true, // Preserve arrays
      }),
      formats: {
        ...(booleanConfig ? null : config.formats),
        date: {
          ...(booleanConfig ? null : config.formats?.date),
          datetime: datetimeFormat,
        },
      },
    },
    intlCache,
  )

  // Remove the native $t function from intlOriginal
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $t, ...otherProps } = intlOriginal
  const intl = otherProps

  /**
   * Shamefully normalize a timestamp to be in seconds as some APIs are returning timestamps in milliseconds
   * TODO: Remove this function once all timestamps are normalized from the backend
   * @param {number} timestamp a unix timestamp in seconds *or milliseconds*
   * @returns {number} a unix timestamp in seconds
   */
  const shamefullyNormalizeTimeStamp = (timestamp: number): number => {
    if (timestamp.toString().length === 13) {
      return Math.floor(timestamp / 1000)
    }
    return timestamp
  }

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
      const date = new Date(shamefullyNormalizeTimeStamp(timestamp) * 1000)

      return intl.formatDate(date, datetimeFormat)
    } catch (err) {
      return invalidDate
    }
  }

  /**
   * Format an ISO formatted date
   * @param {String} isoDate ISO formatted date string
   * @returns {String} date formatted like 'Apr 6, 2022 10:50'
   */
  const formatIsoDate = (isoDate: string): string => {
    const date = Date.parse(isoDate) / 1000

    // excludes milliseconds with trailing 0s
    const flooredDate = Math.floor(date)
    return formatUnixTimeStamp(flooredDate)
  }

  const t = (translationKey: PathToDotNotation<MessageSource, string>, values?: Record<string, MessageFormatPrimitiveValue> | undefined, opts?: IntlMessageFormatOptions): string => {
    return intl.formatMessage(<MessageDescriptor>{ id: translationKey }, values, opts)
  }

  const te = (translationKey: PathToDotNotation<MessageSource, string>): boolean => {
    return !!intl.messages[translationKey]
  }

  const tm = (translationKey: PathToDotNotation<MessageSource, string>): string[] => {
    // @ts-ignore: string is valid key
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

export type { IntlMessageFormatOptions }
