import type { TableDataGridHeader } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
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

  it('warns once for numeric presentation in infinite mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      useTableDataGridColumnDefs({
        headers: ref<Array<TableDataGridHeader<TestRow>>>([{
          bar: 'relative',
          key: 'name',
          label: 'Name',
          showPercentage: true,
        }]),
        slots: {},
      })

      expect(warn).toHaveBeenCalledOnce()
      expect(warn.mock.calls[0][0]).to.contain('unpaginated mode')
    } finally {
      warn.mockRestore()
    }
  })

  it('warns once for nonnumeric values and excludes them from the column total', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const rows = ref([{ value: true }, { value: 25 }])
    const { gridContext } = useTableDataGridColumnDefs({
      headers: ref<Array<TableDataGridHeader<{ value: unknown }>>>([{
        key: 'value', label: 'Value', showPercentage: true,
      }]),
      mode: 'unpaginated', rows, slots: {},
    })

    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('non-finite or nonnumeric')
    expect(gridContext.value.presentation.stats.value.sum).toBe(25)
    rows.value = [{ value: false }, { value: 50 }]
    await nextTick()
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

})
