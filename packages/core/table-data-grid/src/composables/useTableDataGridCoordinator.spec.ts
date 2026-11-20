import type { TableDataGridCoordinator } from '../types'
import type { GridApi } from 'ag-grid-community'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, shallowRef } from 'vue'
import { useTableDataGridCoordinator } from './useTableDataGridCoordinator'

type Row = { id: string, name: string }

const setup = () => {
  const activeChart = ref<string | null>(null)
  const activeDimension = ref<string | null>(null)
  const activeDimensionValue = ref<string | null>(null)
  const coordinator = {
    activate: vi.fn(),
    deactivate: vi.fn(),
    activeChart,
    activeDimension,
    activeDimensionValue,
    DIMENSION_DEBOUNCE_MS: 100,
  } satisfies TableDataGridCoordinator
  const api = { redrawRows: vi.fn(), isDestroyed: () => false } as unknown as GridApi<Row>
  const scope = effectScope()
  const result = scope.run(() => useTableDataGridCoordinator<Row>({
    gridApi: shallowRef(api),
    headers: ref([{ key: 'id', label: 'Id' }, { key: 'name', label: 'Name' }]),
    coordinator,
  }))!
  return { coordinator, api, result, activeChart, activeDimension, activeDimensionValue }
}

describe('useTableDataGridCoordinator', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('highlights rows matching another chart\'s active dimension value after the debounce', async () => {
    const { result, api, activeChart, activeDimension, activeDimensionValue } = setup()
    activeChart.value = 'chart-1'
    activeDimension.value = 'id'
    activeDimensionValue.value = 'a'
    await nextTick()
    expect(result.isHighlighted({ id: 'a', name: 'A' })).toBe(false)

    vi.advanceTimersByTime(100)
    expect(result.isHighlighted({ id: 'a', name: 'A' })).toBe(true)
    expect(result.isHighlighted({ id: 'b', name: 'B' })).toBe(false)
    expect(api.redrawRows).toHaveBeenCalledTimes(1)
  })

  it('ignores a different dimension', async () => {
    const { result, activeChart, activeDimension, activeDimensionValue } = setup()
    activeChart.value = 'chart-1'
    activeDimension.value = 'route'
    activeDimensionValue.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(100)
    expect(result.isHighlighted({ id: 'a', name: 'A' })).toBe(false)
  })

  it('activates on row hover and deactivates on leave', () => {
    const { result, coordinator } = setup()
    result.onCellHover('id', { id: 'a', name: 'A' }, 'a')
    expect(coordinator.activate).toHaveBeenCalledWith(expect.objectContaining({ dimension: 'id', dimensionValue: 'a' }))

    result.onGridLeave()
    expect(coordinator.deactivate).toHaveBeenCalled()
  })
})
