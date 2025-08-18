import { describe, it, expect, beforeAll } from 'vitest'
import useI18n, { createI18n } from './i18n'

const english = {
  global: {
    ok: 'Okay',
  },
  test: {
    withParams: 'Good {dayPart}, My name is {name}!',
    withPluralization: 'There are {count} {count, plural, =0 {versions} =1 {version} other {versions}} available',
    withDateTimeFormatting: '{value, date, datetime}',
  },
  array: {
    disabled: [
      'You cannot update configurations for services',
      'You cannot accept new developer portal applications',
    ],
  },
}

describe('i18n', () => {
  describe('createI18n & useI18n', () => {
    it('Should create local instance of Intl', () => {
      const localI18n = createI18n<typeof english>('en-us', english)
      const globalI18n = useI18n<typeof english>()
      expect(globalI18n).toBeUndefined()
      expect(localI18n?.t).toBeTypeOf('function')
      expect(localI18n?.messages['global.ok']).toEqual('Okay')
      expect(localI18n?.source.global).toEqual({ ok: 'Okay' })
    })

    it('Should create global instance of Intl', () => {
      createI18n<typeof english>('en-us', english, true)
      const i18n = useI18n<typeof english>()

      expect(i18n?.t).toBeTypeOf('function')
      expect(i18n?.messages['global.ok']).toEqual('Okay')
      expect(i18n?.source.global).toEqual({ ok: 'Okay' })
    })

    it('Local and global instances should be different', () => {
      const globalInstance = { global: { ok: 'not Okay' } }
      createI18n<typeof globalInstance>('en-us', globalInstance, true)
      const globalI18n = useI18n<typeof globalInstance>()

      const localI18n = createI18n<typeof english>('en-us', english)

      expect(globalI18n?.messages['global.ok']).not.toEqual(localI18n?.messages['global.ok'])
    })
  })

  describe('function `t`', () => {
    beforeAll(() => {
      createI18n<typeof english>('en-us', english, true)
    })
    it('should format simple message', () => {
      const { t } = useI18n<typeof english>()
      expect(t('global.ok')).toEqual('Okay')
    })

    it('should format message with parameters', () => {
      const { t } = useI18n<typeof english>()
      expect(t('test.withParams', { dayPart: 'Morning', name: 'i18n' })).toEqual('Good Morning, My name is i18n!')
    })

    it('should format message with pluralization', () => {
      const { t } = useI18n<typeof english>()
      expect(t('test.withPluralization', { count: 0 })).toEqual('There are 0 versions available')
      expect(t('test.withPluralization', { count: 1 })).toEqual('There are 1 version available')
      expect(t('test.withPluralization', { count: 11 })).toEqual('There are 11 versions available')
    })
    it('should format message with datetime', () => {
      const { t } = useI18n<typeof english>()
      expect(t('test.withDateTimeFormatting', { value: new Date(0).getTime() })).toEqual('Jan 1, 1970, 12:00 AM')
      expect(t('test.withDateTimeFormatting', { value: new Date(1701344449607).getTime() })).toEqual('Nov 30, 2023, 11:40 AM')
      expect(t('test.withDateTimeFormatting', { value: 0 })).toEqual('Jan 1, 1970, 12:00 AM')
      expect(t('test.withDateTimeFormatting', { value: 1701344449607 })).toEqual('Nov 30, 2023, 11:40 AM')
      expect(t('test.withDateTimeFormatting', { value: Date.parse('Jan 1, 1970, 12:00 AM') })).toEqual('Jan 1, 1970, 12:00 AM')
      expect(t('test.withDateTimeFormatting', { value: Date.parse('Nov 30, 2023, 11:40 AM') })).toEqual('Nov 30, 2023, 11:40 AM')
    })
  })

  describe('function `te`', () => {
    beforeAll(() => {
      createI18n<typeof english>('en-us', english, true)
    })

    it('should recognize exiting key', () => {
      const { te } = useI18n<typeof english>()
      expect(te('global.ok')).toBeTruthy()
    })

    it('should recognize non-exiting key', () => {
      const { te } = useI18n<typeof english>()
      // @ts-expect-error: allow invalid key
      expect(te('global.not.ok')).toBeFalsy()
    })
  })

  describe('function `tm`', () => {
    beforeAll(() => {
      createI18n<typeof english>('en-us', english, true)
    })

    it('should return array for exiting key', () => {
      const { tm } = useI18n<typeof english>()
      expect(tm('array.disabled')).toEqual([
        'You cannot update configurations for services',
        'You cannot accept new developer portal applications',
      ])
    })

    it('should return empty array for non-existing key', () => {
      const { tm } = useI18n<typeof english>()
      // @ts-expect-error: allow invalid key
      expect(tm('global.not.ok')).toEqual([])
    })
  })

  describe('formatUnixTimeStamp()', () => {
    beforeAll(() => {
      createI18n<typeof english>('en-us', english, true)
    })

    it('should return a properly formatted date', () => {
      const { formatUnixTimeStamp } = useI18n<typeof english>()
      const formattedDateAM = formatUnixTimeStamp(1558006979)
      const formattedDatePM = formatUnixTimeStamp(1558057179)
      const january = formatUnixTimeStamp(1547506800)
      const october = formatUnixTimeStamp(1570111995)
      const november = formatUnixTimeStamp(1573772400)
      const decimalTimestamp = formatUnixTimeStamp(1570111995.652561)
      const integerTimestamp = formatUnixTimeStamp(1570111995)
      const timestampInMs = formatUnixTimeStamp(1542068280000)
      const timestampWithTwoDecimalPlaces = formatUnixTimeStamp(1570111995.65)

      expect(formattedDateAM).toBe('May 16, 2019, 11:42 AM')
      expect(formattedDatePM).toBe('May 17, 2019, 1:39 AM')
      expect(january.substring(0, 7)).toBe('Jan 14,')
      expect(october.substring(0, 7)).toBe('Oct 3, ')
      expect(november.substring(0, 7)).toBe('Nov 14,')
      expect(decimalTimestamp).toEqual(integerTimestamp)
      expect(timestampInMs).toBe('Nov 13, 2018, 12:18 AM')
      expect(timestampWithTwoDecimalPlaces).toEqual(integerTimestamp)
    })
  })

  describe('formatIsoDate()', () => {
    beforeAll(() => {
      createI18n<typeof english>('en-us', english, true)
    })

    it('should return a properly formatted date', () => {
      const { formatIsoDate } = useI18n<typeof english>()
      const formattedDateAM = formatIsoDate('2019-05-16T11:42:59.000Z')
      const formattedDatePM = formatIsoDate('2019-05-17T01:39:39.000Z')
      const january = formatIsoDate('2019-01-14T23:00:00.000Z')
      const october = formatIsoDate('2019-10-03T14:13:15.000Z')
      const november = formatIsoDate('2019-11-14T23:00:00.000Z')
      const decimalTimestamp = formatIsoDate('2019-10-03T14:13:15.000Z')
      const integerTimestamp = formatIsoDate('2019-10-03T14:13:15.000Z')

      expect(formatIsoDate('2019-10-03T14:13:15.123Z')).toBe('Oct 3, 2019, 2:13 PM')
      expect(formatIsoDate('2019-10-03T14:13:15.000Z')).toBe('Oct 3, 2019, 2:13 PM')
      expect(formatIsoDate('2019-10-03T14:13:15Z')).toBe('Oct 3, 2019, 2:13 PM')
      expect(formatIsoDate('2019-05-16T11:42:59+00:00')).toBe('May 16, 2019, 11:42 AM')
      expect(formatIsoDate('2019-05-16T11:42:59-04:00')).toBe('May 16, 2019, 3:42 PM')
      expect(formatIsoDate('2019-05-16T11:42:59+08:00')).toBe('May 16, 2019, 3:42 AM')

      expect(formattedDateAM).toBe('May 16, 2019, 11:42 AM')
      expect(formattedDatePM).toBe('May 17, 2019, 1:39 AM')
      expect(january.substring(0, 7)).toBe('Jan 14,')
      expect(october.substring(0, 7)).toBe('Oct 3, ')
      expect(november.substring(0, 7)).toBe('Nov 14,')
      expect(decimalTimestamp).toEqual(integerTimestamp)
    })
  })

  // the cases bellow are for reference only. See https://formatjs.io/docs/intl/ for more details and usage

  describe('formatNumber', () => {
    beforeAll(() => {
      createI18n<typeof english>('en-us', english, true)
    })

    it('should format currency', () => {
      const { formatNumber } = useI18n<typeof english>()

      const formattedNumber = formatNumber(1000, { style: 'currency', currency: 'USD' })
      expect(formattedNumber).toEqual('$1,000.00')
    })
  })

  describe('formatDate', () => {
    beforeAll(() => {
      createI18n<typeof english>('en-us', english, true)
    })
    it('should format date', () => {
      const { formatDate } = useI18n<typeof english>()

      const formattedDate = formatDate(Date.parse('12/12/2012'), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      expect(formattedDate).toEqual('December 12, 2012')
    })
  })

  describe('createI18nEx', () => {
    it('should call custom errorhandler', () => {
      let counter = 0
      const { t } = createI18n<typeof english>(
        'en-us',
        english,
        {
          onError: (err: any) => {
            console.error(err)
            counter++
          },
          isGlobal: true,
        })
      // @ts-ignore: allow invalid key
      t('unknown-key')
      expect(counter).toEqual(1)
    })
  })
})
