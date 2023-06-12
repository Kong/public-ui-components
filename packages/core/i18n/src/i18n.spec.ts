import { describe, it, expect, beforeAll } from 'vitest'
import useI18n, { createI18n, createI18nEx } from './i18n'

const english = {
  global: {
    ok: 'Okay',
  },
  test: {
    withParams: 'Good {dayPart}, My name is {name}!',
    withPluralization: 'There are {count} {count, plural, =0 {versions} =1 {version} other {versions}} available',
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
      // @ts-expect-error
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
      // @ts-expect-error
      expect(tm('global.not.ok')).toEqual([])
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
      const { t } = createI18nEx<typeof english>({
        locale: 'en-us',
        messages: english,
        onError: (err) => {
          console.error(err)
          counter++
        },
      }, true)
      // @ts-ignore
      t('unknown-key')
      expect(counter).toEqual(1)
    })
  })
})
