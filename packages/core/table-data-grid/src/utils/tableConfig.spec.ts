import { describe, expect, it } from 'vitest'
import { resolveTableConfig, tableConfigsEqual } from './tableConfig'

const headers = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
]

describe('resolveTableConfig', () => {
  it('falls back to the component page size when config is absent', () => {
    expect(resolveTableConfig({ config: undefined, headers, pageSize: 25 })).toEqual({
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
      pageSize: 25,
    })
  })

  it('keeps a sort key that matches a sortable header', () => {
    expect(resolveTableConfig({
      config: { sortColumnKey: 'name', sortColumnOrder: 'asc' },
      headers,
      pageSize: 25,
    })).toEqual({
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      pageSize: 25,
    })
  })

  it('drops a sort key that no longer matches any header', () => {
    expect(resolveTableConfig({
      config: { sortColumnKey: 'removed', sortColumnOrder: 'asc' },
      headers,
      pageSize: 25,
    }).sortColumnKey).toBeUndefined()
  })

  it('drops a sort key whose header is not sortable', () => {
    expect(resolveTableConfig({
      config: { sortColumnKey: 'status', sortColumnOrder: 'asc' },
      headers,
      pageSize: 25,
    }).sortColumnKey).toBeUndefined()
  })

  it('drops the sort order when the sort key is dropped', () => {
    expect(resolveTableConfig({
      config: { sortColumnKey: 'removed', sortColumnOrder: 'desc' },
      headers,
      pageSize: 25,
    }).sortColumnOrder).toBeUndefined()
  })

  it('prefers an explicit config page size over the component default', () => {
    expect(resolveTableConfig({
      config: { pageSize: 50 },
      headers,
      pageSize: 25,
    }).pageSize).toBe(50)
  })
})

describe('tableConfigsEqual', () => {
  it('treats identical resolved configs as equal', () => {
    const a = { sortColumnKey: 'name', sortColumnOrder: 'asc' as const, pageSize: 25 }
    const b = { sortColumnKey: 'name', sortColumnOrder: 'asc' as const, pageSize: 25 }
    expect(tableConfigsEqual(a, b)).toBe(true)
  })

  it('treats an undefined field as distinct from a differing defined value', () => {
    const withSort = { sortColumnKey: 'name', sortColumnOrder: 'asc' as const, pageSize: 25 }
    const withoutSort = { sortColumnKey: undefined, sortColumnOrder: undefined, pageSize: 25 }
    expect(tableConfigsEqual(withSort, withoutSort)).toBe(false)
  })

  it('treats a page size difference as unequal', () => {
    const a = { sortColumnKey: undefined, sortColumnOrder: undefined, pageSize: 25 }
    const b = { sortColumnKey: undefined, sortColumnOrder: undefined, pageSize: 50 }
    expect(tableConfigsEqual(a, b)).toBe(false)
  })
})
