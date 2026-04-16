import { describe, expect, it } from 'vitest'
import { isDefinedByBasic } from './helpers'
import { DEFAULT_PROTOCOL, INITIAL_ROUTE_RULES_FIELDS } from '../constants'

const buildBasicData = (overrides: Record<string, unknown> = {}) => ({
  ...INITIAL_ROUTE_RULES_FIELDS,
  protocols: DEFAULT_PROTOCOL.split(','),
  paths: [''],
  hosts: [''],
  headers: null,
  snis: [],
  sources: [],
  destinations: [],
  ...overrides,
})

describe('isDefinedByBasic', () => {
  it('returns true for default protocol and base fields', () => {
    expect(isDefinedByBasic(buildBasicData())).toBe(true)
  })

  it('returns false for non-default protocols', () => {
    expect(isDefinedByBasic(buildBasicData({ protocols: ['http', 'https'] }))).toBe(false)
  })
})
