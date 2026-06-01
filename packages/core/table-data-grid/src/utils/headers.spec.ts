import { describe, expect, it } from 'vitest'
import { getFilterSlotName, isColumnHideable } from './headers'

describe('headers utils', () => {
  it('uses filter keys for forwarded filter slot names', () => {
    expect(getFilterSlotName('status')).toBe('filter-status')
  })

  it('treats columns as hideable unless explicitly disabled', () => {
    expect(isColumnHideable({ key: 'status', label: 'Status' })).toBe(true)
    expect(isColumnHideable({ key: 'status', label: 'Status', hideable: true })).toBe(true)
    expect(isColumnHideable({ key: 'status', label: 'Status', hideable: false })).toBe(false)
  })
})
