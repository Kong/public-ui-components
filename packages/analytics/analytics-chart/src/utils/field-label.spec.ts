import { describe, it, expect } from 'vitest'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

import { fieldLabel } from './field-label'

const i18n = createI18n<typeof english>('en-us', english)

describe('fieldLabel', () => {
  const emptyMap = new Map<string, string>()
  const map = new Map<string, string>([['ai_count', 'Custom AI count label']])
  const blankConfigMap = new Map<string, string>([['ai_count', '']])

  it('prefers the datasource config label', () => {
    expect(fieldLabel(i18n, map, 'ai_count')).toBe('Custom AI count label')
  })

  it('falls through when the config label is an empty string', () => {
    expect(fieldLabel(i18n, blankConfigMap, 'ai_count')).toBe('LLM request count')
    expect(fieldLabel(i18n, emptyMap, 'unknown-key')).toBe('unknown-key')
  })

  it('translates known chartLabels keys', () => {
    expect(fieldLabel(i18n, emptyMap, 'ai_count')).toBe('LLM request count')
  })

  it('returns the key when nothing matches', () => {
    expect(fieldLabel(i18n, emptyMap, 'not_a_field')).toBe('not_a_field')
  })

  it('honors a custom fallback', () => {
    expect(fieldLabel(i18n, emptyMap, 'not_a_field', { fallback: '' })).toBe('')
  })

  it('looks up an alternative namespace via prefix', () => {
    expect(fieldLabel(i18n, emptyMap, 'request_count', { prefix: 'metricAxisTitles' })).toBe('Request count')
    expect(fieldLabel(i18n, emptyMap, 'not_a_field', { prefix: 'metricAxisTitles' })).toBe('not_a_field')
  })
})
