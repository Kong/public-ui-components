import { describe, it, expect } from 'vitest'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

import { fieldLabel } from './field-label'

const i18n = createI18n<typeof english>('en-us', english)

describe('fieldLabel', () => {
  const emptyMap = new Map<string, string>()
  const map = new Map<string, string>([['control_plane', 'Custom control plane label']])
  const blankConfigMap = new Map<string, string>([['control_plane', '']])

  it('prefers the datasource config label', () => {
    expect(fieldLabel(i18n, map, 'control_plane')).toBe('Custom control plane label')
  })

  it('falls through when the config label is an empty string', () => {
    expect(fieldLabel(i18n, blankConfigMap, 'control_plane')).toBe('Control plane')
    expect(fieldLabel(i18n, emptyMap, 'unknown-key')).toBe('unknown-key')
  })

  it('translates known chartLabels keys', () => {
    expect(fieldLabel(i18n, emptyMap, 'control_plane')).toBe('Control plane')
  })

  it('returns the key when nothing matches', () => {
    expect(fieldLabel(i18n, emptyMap, 'not_a_field')).toBe('not_a_field')
  })

  it('honors a custom fallback', () => {
    expect(fieldLabel(i18n, emptyMap, 'not_a_field', { fallback: '' })).toBe('')
  })

  it('looks up an alternative namespace via prefix', () => {
    expect(fieldLabel(i18n, emptyMap, 'minutely', { prefix: 'granularities' })).toBe('1 minute')
    expect(fieldLabel(i18n, emptyMap, 'not_a_field', { prefix: 'granularities' })).toBe('not_a_field')
  })
})
