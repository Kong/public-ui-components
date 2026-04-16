import { describe, it, expect } from 'vitest'
import useUrlValidators from './useUrlValidators'
import composables from '.'
import type { SelectItem } from '@kong/kongponents'

describe('validateHost()', () => {
  const { i18n: { t } } = composables.useI18n()
  const { validateHost } = useUrlValidators()
  const invalidMessage = t('gateway_services.form.errors.host.invalid')
  const emptyMessage = t('gateway_services.form.errors.host.empty')

  it('should accept valid domain names', () => {
    expect(validateHost('localhost')).toBe('')
    expect(validateHost('a.b')).toBe('')
    expect(validateHost('example.com')).toBe('')
    expect(validateHost('sub.example.com')).toBe('')
    expect(validateHost('sub-domain.example.com')).toBe('')
    expect(validateHost('example-domain.co.uk')).toBe('')
    expect(validateHost('a-valid-domain123.org')).toBe('')
    expect(validateHost('a-valid-domain123.org.')).toBe('') // Trailing dot is technically valid in DNS, though often omitted
  })

  it('should accept valid IP addresses', () => {
    expect(validateHost('192.168.1.1')).toBe('')
    expect(validateHost('10.0.0.1')).toBe('')
    expect(validateHost('172.16.0.1')).toBe('')
    expect(validateHost('255.255.255.255')).toBe('')
    expect(validateHost('0.0.0.0')).toBe('')
    expect(validateHost('127.0.0.1')).toBe('')
    expect(validateHost('::')).toBe('')
    expect(validateHost('::127.0.0.1')).toBe('')
    expect(validateHost('2001:add:aaaa:0000:0000:bbbb:ccc:dddd')).toBe('')
    expect(validateHost('2001:add:aaaa::cccc:dddd:ee')).toBe('')
    // it's a valid FQDN, looks like an IPv4 address but it actually is a valid domain name, so should be accepted
    expect(validateHost('192.168.1')).toBe('')
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
    expect(validateHost('256.1.1.1')).toBe(invalidMessage)
    expect(validateHost('127.0.0.1:53')).toBe(invalidMessage) // Invalid IPv4 with port
    expect(validateHost(':::1')).toBe(invalidMessage) // Invalid IPv6 with triple colon
    expect(validateHost('2001::gggg')).toBe(invalidMessage) // Invalid hex in IPv6
    expect(validateHost('::aa::bb:1')).toBe(invalidMessage) // Invalid IPv6 with multiple '::'
    expect(validateHost('[2001:]')).toBe(invalidMessage) // Should not have brackets
    expect(validateHost('[2001:]:53')).toBe(invalidMessage) // Invalid IPv6 with brackets and port
    expect(validateHost(':1::1')).toBe(invalidMessage) // Invalid IPv6 with single colon at start
    expect(validateHost('1::1:')).toBe(invalidMessage) // Invalid IPv6 with single colon at end
  })

  it('should reject URLs and other non-host strings', () => {
    expect(validateHost('http://example.com')).toBe(invalidMessage)
    expect(validateHost('https://example.com')).toBe(invalidMessage)
    expect(validateHost('bad.cad:8080')).toBe(invalidMessage)
    expect(validateHost('example.com:8080')).toBe(invalidMessage)
    expect(validateHost('example.com/path')).toBe(invalidMessage)
    expect(validateHost('user@example.com')).toBe(invalidMessage)
  })
})

describe('validatePort()', () => {
  const { i18n: { t } } = composables.useI18n()
  const { validatePort } = useUrlValidators()
  const invalidMessage = t('gateway_services.form.errors.port.invalid')

  it('should accept valid ports', () => {
    expect(validatePort(80)).toBe('')
    expect(validatePort('80')).toBe('')
    expect(validatePort(443)).toBe('')
    expect(validatePort('8080')).toBe('')
    expect(validatePort(0)).toBe('')
    expect(validatePort('0')).toBe('')
    expect(validatePort(65535)).toBe('')
    expect(validatePort('65535')).toBe('')
  })

  it('should accept empty, null, or undefined ports', () => {
    expect(validatePort('')).toBe('')
    expect(validatePort(null)).toBe('')
    expect(validatePort(undefined)).toBe('')
  })

  it('should reject ports outside the valid range', () => {
    expect(validatePort(-1)).toBe(invalidMessage)
    expect(validatePort('-1')).toBe(invalidMessage)
    expect(validatePort(65536)).toBe(invalidMessage)
    expect(validatePort('65536')).toBe(invalidMessage)
    expect(validatePort(100000)).toBe(invalidMessage)
  })
})

describe('validatePath()', () => {
  const { i18n: { t } } = composables.useI18n()
  const { validatePath } = useUrlValidators()
  const prefixMessage = t('gateway_services.form.errors.path.prefix')
  const invalidMessage = t('gateway_services.form.errors.path.invalid')

  it('should accept valid paths', () => {
    expect(validatePath('/api')).toBe('')
    expect(validatePath('/v1/users')).toBe('')
    expect(validatePath('/path/to/resource')).toBe('')
    expect(validatePath('/path-with-hyphens')).toBe('')
    expect(validatePath('/path_with_underscores')).toBe('')
    expect(validatePath('/path.with.dots')).toBe('')
    expect(validatePath('/users/123')).toBe('')
    expect(validatePath('/search?q=term')).toBe('')
    expect(validatePath('/resource#section')).toBe('')
  })

  it('should accept empty, null, or undefined paths', () => {
    expect(validatePath('')).toBe('')
    expect(validatePath(null)).toBe('')
    expect(validatePath(undefined)).toBe('')
  })

  it('should reject paths that do not start with a slash', () => {
    expect(validatePath('api')).toBe(prefixMessage)
    expect(validatePath('v1/users')).toBe(prefixMessage)
    expect(validatePath('resource')).toBe(prefixMessage)
  })

  it('should reject paths with invalid characters', () => {
    expect(validatePath('/path with spaces')).toBe(invalidMessage)
    expect(validatePath('/path<with>brackets')).toBe(invalidMessage)
    expect(validatePath('/path\\with\\backslashes')).toBe(invalidMessage)
    expect(validatePath('/path"with"quotes')).toBe(invalidMessage)
    expect(validatePath('/path|with|pipes')).toBe(invalidMessage)
    expect(validatePath('/path^with^carets')).toBe(invalidMessage)
    expect(validatePath('/path`with`backticks')).toBe(invalidMessage)
  })
})

describe('validateProtocol()', () => {
  const { i18n: { t } } = composables.useI18n()
  const { validateProtocol } = useUrlValidators()
  const emptyMessage = t('gateway_services.form.errors.protocol.empty')
  const invalidMessage = t('gateway_services.form.errors.protocol.invalid')

  // Mock ProtocolItems for testing
  const ProtocolItems: SelectItem[] = [
    { label: 'HTTP', value: 'http' },
    { label: 'HTTPS', value: 'https' },
    { label: 'FTP', value: 'ftp' },
    { label: 'SMTP', value: 'smtp' },
  ]

  it('should accept valid protocols', () => {
    expect(validateProtocol('http:', ProtocolItems)).toBe('')
    expect(validateProtocol('https:', ProtocolItems)).toBe('')
    expect(validateProtocol('ftp:', ProtocolItems)).toBe('')
    expect(validateProtocol('smtp:', ProtocolItems)).toBe('')
  })

  it('should reject empty or whitespace-only protocols', () => {
    expect(validateProtocol('', ProtocolItems)).toBe(emptyMessage)
    expect(validateProtocol('   ', ProtocolItems)).toBe(emptyMessage)
    // @ts-ignore: allow undefined for test value
    expect(validateProtocol(undefined, ProtocolItems)).toBe(emptyMessage)
    // @ts-ignore: allow null for test value
    expect(validateProtocol(null, ProtocolItems)).toBe(emptyMessage)
  })

  it('should reject invalid protocols', () => {
    expect(validateProtocol('sftp:', ProtocolItems)).toBe(invalidMessage)
    expect(validateProtocol('ssh:', ProtocolItems)).toBe(invalidMessage)
    expect(validateProtocol('telnet:', ProtocolItems)).toBe(invalidMessage)
    expect(validateProtocol('invalid:', ProtocolItems)).toBe(invalidMessage)
  })

  it('should reject protocols with case mismatch', () => {
    expect(validateProtocol('HTTP:', ProtocolItems)).toBe(invalidMessage)
    expect(validateProtocol('Http:', ProtocolItems)).toBe(invalidMessage)
  })
})
