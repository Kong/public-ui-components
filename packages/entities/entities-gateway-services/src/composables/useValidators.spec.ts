import { describe, it, expect } from 'vitest'
import useUrlValidators from './useUrlValidators'
import composables from '.'

describe('validateHost()', () => {
  const { i18n: { t } } = composables.useI18n()
  const { validateHost } = useUrlValidators()
  const invalidMessage = t('gateway_services.form.errors.host.invalid')
  const emptyMessage = t('gateway_services.form.errors.host.empty')

  it('should accept valid domain names', () => {
    expect(validateHost('example.com')).toBe('')
    expect(validateHost('sub.example.com')).toBe('')
    expect(validateHost('sub-domain.example.com')).toBe('')
    expect(validateHost('example-domain.co.uk')).toBe('')
    expect(validateHost('localhost')).toBe('')
    expect(validateHost('a-valid-domain123.org')).toBe('')
  })

  it('should accept valid IP addresses', () => {
    expect(validateHost('192.168.1.1')).toBe('')
    expect(validateHost('10.0.0.1')).toBe('')
    expect(validateHost('172.16.0.1')).toBe('')
    expect(validateHost('255.255.255.255')).toBe('')
    expect(validateHost('0.0.0.0')).toBe('')
    expect(validateHost('127.0.0.1')).toBe('')
  })

  it('should reject empty or whitespace-only hosts', () => {
    expect(validateHost('')).toBe(emptyMessage)
    expect(validateHost('   ')).toBe(emptyMessage)
    // @ts-ignore: allow undefined for test value
    expect(validateHost(undefined)).toBe(emptyMessage)
    // @ts-ignore: allow null for test value
    expect(validateHost(null)).toBe(emptyMessage)
  })

  it('should reject invalid domain names', () => {
    expect(validateHost('example..com')).toBe(invalidMessage)
    expect(validateHost('-example.com')).toBe(invalidMessage)
    expect(validateHost('example-.com')).toBe(invalidMessage)
    expect(validateHost('example.com-')).toBe(invalidMessage)
    expect(validateHost('exam ple.com')).toBe(invalidMessage)
    expect(validateHost('exam_ple.com')).toBe(invalidMessage)
    expect(validateHost('example.com!')).toBe(invalidMessage)
    expect(validateHost('example@.com')).toBe(invalidMessage)
  })

  it('should reject invalid IP addresses', () => {
    expect(validateHost('256.0.0.1')).toBe(invalidMessage)
    expect(validateHost('192.168.1')).toBe(invalidMessage)
    expect(validateHost('192.168.1.1.1')).toBe(invalidMessage)
    expect(validateHost('192.168.1.-1')).toBe(invalidMessage)
    expect(validateHost('192.168.01.1')).toBe(invalidMessage)
    expect(validateHost('192.168.1.1/24')).toBe(invalidMessage)
  })

  it('should reject URLs and other non-host strings', () => {
    expect(validateHost('http://example.com')).toBe(invalidMessage)
    expect(validateHost('https://example.com')).toBe(invalidMessage)
    expect(validateHost('example.com:8080')).toBe(invalidMessage)
    expect(validateHost('example.com/path')).toBe(invalidMessage)
    expect(validateHost('user@example.com')).toBe(invalidMessage)
  })
})
