import type { TableDataGridConfig, TableDataGridHeader } from '../types'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useTableDataGridConfig } from './useTableDataGridConfig'

type TestRow = {
  name: string
  status: string
}

const headers: Array<TableDataGridHeader<TestRow>> = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
]

describe('useTableDataGridConfig', () => {
  it('resolves the initial tableConfig prop against headers and page size', () => {
    const tableConfig = ref<TableDataGridConfig | undefined>({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    const emitTableConfigUpdate = vi.fn()

    const { activeTableConfig, activeSort, activePageSize } = useTableDataGridConfig<TestRow>({
      headers: ref(headers),
      pageSize: ref(25),
      tableConfig,
      emitTableConfigUpdate,
    })

    expect(activeTableConfig.value).toEqual({ sortColumnKey: 'name', sortColumnOrder: 'asc', pageSize: 25 })
    expect(activeSort.value).toEqual({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    expect(activePageSize.value).toBe(25)
  })

  it('resyncs from a host-driven prop change and notifies the caller', async () => {
    const tableConfig = ref<TableDataGridConfig | undefined>(undefined)
    const emitTableConfigUpdate = vi.fn()
    const onExternalConfigChange = vi.fn()

    const { activeSort } = useTableDataGridConfig<TestRow>({
      headers: ref(headers),
      pageSize: ref(25),
      tableConfig,
      emitTableConfigUpdate,
      onExternalConfigChange,
    })

    tableConfig.value = { sortColumnKey: 'name', sortColumnOrder: 'desc' }
    await nextTick()

    expect(activeSort.value).toEqual({ sortColumnKey: 'name', sortColumnOrder: 'desc' })
    expect(onExternalConfigChange).toHaveBeenCalledWith({ sortColumnKey: 'name', sortColumnOrder: 'desc', pageSize: 25 })
    // emitTableConfigUpdate is only for grid-driven writes via patchTableConfig.
    expect(emitTableConfigUpdate).not.toHaveBeenCalled()
  })

  it('does not notify the caller when a prop change resolves to the same config', async () => {
    const tableConfig = ref<TableDataGridConfig | undefined>({ sortColumnKey: 'status', sortColumnOrder: 'asc' })
    const onExternalConfigChange = vi.fn()

    useTableDataGridConfig<TestRow>({
      headers: ref(headers),
      pageSize: ref(25),
      tableConfig,
      emitTableConfigUpdate: vi.fn(),
      onExternalConfigChange,
    })

    // 'status' isn't sortable, so this resolves to the same (empty) sort as
    // the initial value — no real change.
    tableConfig.value = { sortColumnKey: 'status', sortColumnOrder: 'desc' }
    await nextTick()

    expect(onExternalConfigChange).not.toHaveBeenCalled()
  })

  it('patchTableConfig emits update:tableConfig only on a real change', () => {
    const tableConfig = ref<TableDataGridConfig | undefined>(undefined)
    const emitTableConfigUpdate = vi.fn()

    const { activeTableConfig, patchTableConfig } = useTableDataGridConfig<TestRow>({
      headers: ref(headers),
      pageSize: ref(25),
      tableConfig,
      emitTableConfigUpdate,
    })

    patchTableConfig({ sortColumnKey: 'name', sortColumnOrder: 'asc' })

    expect(activeTableConfig.value).toEqual({ sortColumnKey: 'name', sortColumnOrder: 'asc', pageSize: 25 })
    expect(emitTableConfigUpdate).toHaveBeenCalledTimes(1)
    expect(emitTableConfigUpdate).toHaveBeenCalledWith({ sortColumnKey: 'name', sortColumnOrder: 'asc', pageSize: 25 })

    emitTableConfigUpdate.mockClear()
    patchTableConfig({ sortColumnKey: 'name', sortColumnOrder: 'asc' })

    expect(emitTableConfigUpdate).not.toHaveBeenCalled()
  })

  it('keeps a grid-driven sort when headers change afterward, uncontrolled', async () => {
    const tableConfig = ref<TableDataGridConfig | undefined>(undefined)
    const headersRef = ref(headers)

    const { activeSort, patchTableConfig } = useTableDataGridConfig<TestRow>({
      headers: headersRef,
      pageSize: ref(25),
      tableConfig,
      emitTableConfigUpdate: vi.fn(),
    })

    patchTableConfig({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    expect(activeSort.value).toEqual({ sortColumnKey: 'name', sortColumnOrder: 'asc' })

    // Uncontrolled: there's no tableConfig prop to re-resolve against, so an
    // unrelated headers change must not wipe the grid-driven sort above.
    headersRef.value = [...headers]
    await nextTick()

    expect(activeSort.value).toEqual({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
  })

  it('never echoes a grid-driven patch back through the prop watcher', async () => {
    const tableConfig = ref<TableDataGridConfig | undefined>(undefined)
    const onExternalConfigChange = vi.fn()

    const { patchTableConfig } = useTableDataGridConfig<TestRow>({
      headers: ref(headers),
      pageSize: ref(25),
      tableConfig,
      emitTableConfigUpdate: vi.fn(),
      onExternalConfigChange,
    })

    patchTableConfig({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    await nextTick()

    // patchTableConfig writes activeTableConfig directly, never the prop, so
    // the prop-driven onExternalConfigChange path is never triggered by it.
    expect(onExternalConfigChange).not.toHaveBeenCalled()
  })
})
