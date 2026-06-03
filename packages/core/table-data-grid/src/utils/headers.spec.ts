import { describe, expect, it } from 'vitest'
import type { Filter } from '@kong/kongponents'
import { getFilterGroupFilters, getFilterSlotName, isColumnHideable } from './headers'

describe('headers utils', () => {
  it('uses filter keys for forwarded filter slot names', () => {
    expect(getFilterSlotName('status')).toBe('filter-status')
  })

  it('derives KFilterGroup filters from filterable headers', () => {
    const statusFilter = {
      type: 'select',
      values: [],
    } as unknown as Filter

    expect(getFilterGroupFilters([
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', filter: statusFilter },
    ])).toEqual({
      status: statusFilter,
    })
  })

  it('treats columns as hideable unless explicitly disabled', () => {
    expect(isColumnHideable({ key: 'status', label: 'Status' })).toBe(true)
    expect(isColumnHideable({ key: 'status', label: 'Status', hideable: true })).toBe(true)
    expect(isColumnHideable({ key: 'status', label: 'Status', hideable: false })).toBe(false)
  })
})
