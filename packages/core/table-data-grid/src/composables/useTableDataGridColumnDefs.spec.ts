import type { TableDataGridHeader } from '../types'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useTableDataGridColumnDefs } from './useTableDataGridColumnDefs'

type TestRow = {
  name: string
  status: string
}

describe('useTableDataGridColumnDefs', () => {
  it('defaults sortable to false when a header omits it', () => {
    const headers: Array<TableDataGridHeader<TestRow>> = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', sortable: true },
    ]

    const { columnDefs } = useTableDataGridColumnDefs<TestRow>({
      headers: ref(headers),
      slots: {},
    })

    expect(columnDefs.value.find(colDef => colDef.colId === 'name')?.sortable).toBe(false)
    expect(columnDefs.value.find(colDef => colDef.colId === 'status')?.sortable).toBe(true)
  })

  it('seeds the initial sort onto only the matching column, via initialSort/initialSortIndex', () => {
    const headers: Array<TableDataGridHeader<TestRow>> = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
    ]

    const { columnDefs } = useTableDataGridColumnDefs<TestRow>({
      headers: ref(headers),
      slots: {},
      initialSort: { sortColumnKey: 'name', sortColumnOrder: 'desc' },
    })

    const nameColDef = columnDefs.value.find(colDef => colDef.colId === 'name')
    const statusColDef = columnDefs.value.find(colDef => colDef.colId === 'status')

    expect(nameColDef).toMatchObject({ initialSort: 'desc', initialSortIndex: 0 })
    expect(statusColDef).not.toHaveProperty('initialSort')
    expect(statusColDef).not.toHaveProperty('initialSortIndex')

    // sort/sortIndex are stateful AG Grid props — re-asserting them on every
    // column defs recompute would override the grid's current sort with this
    // mount-time snapshot. initialSort/initialSortIndex only apply once.
    expect(nameColDef).not.toHaveProperty('sort')
    expect(nameColDef).not.toHaveProperty('sortIndex')
  })

  it('does not seed a sort at all when no initialSort is given', () => {
    const headers: Array<TableDataGridHeader<TestRow>> = [
      { key: 'name', label: 'Name', sortable: true },
    ]

    const { columnDefs } = useTableDataGridColumnDefs<TestRow>({
      headers: ref(headers),
      slots: {},
    })

    expect(columnDefs.value[0]).not.toHaveProperty('initialSort')
    expect(columnDefs.value[0]).not.toHaveProperty('initialSortIndex')
  })
})
