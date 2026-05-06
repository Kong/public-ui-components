import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  buildColumnStateFromConfig,
  createResolvedTableConfig,
  getConfigFromGrid,
  mergeColumnOrder,
  normalizedTableConfigsEqual,
  normalizeTableConfig,
} from '../utils/tableConfig'
import { useAnalyticsDatatableFetchers } from '../composables/useAnalyticsDatatableFetchers'
import { useDatatablePagination } from '../composables/useDatatablePagination'
import type { AnalyticsDatatableFetcher, AnalyticsDatatableHeader } from '../types'
import type { GridApi } from 'ag-grid-community'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('table config utilities', () => {
  const headers: Array<AnalyticsDatatableHeader<TestRow>> = [
    { key: 'name', label: 'Name', width: 200, pinned: 'left' },
    { key: 'status', label: 'Status' },
  ]

  it('normalizes partial table config values without mutating input', () => {
    const partialConfig = {
      columnVisibility: { status: false },
      pageSize: 50,
    }

    expect(normalizeTableConfig(partialConfig)).toEqual({
      columnOrder: [],
      columnVisibility: { status: false },
      columnWidths: {},
      pinnedColumns: {},
      pageSize: 50,
    })
    expect(partialConfig).toEqual({
      columnVisibility: { status: false },
      pageSize: 50,
    })
  })

  it('resolves partial table config values against current headers', () => {
    expect(createResolvedTableConfig({
      headers: [
        ...headers,
        { key: 'method', label: 'Method' },
      ],
      pageSize: 25,
      config: {
        columnOrder: ['status', 'stale'],
        columnVisibility: {
          status: false,
          stale: false,
        },
        columnWidths: {
          name: 200,
          stale: 100,
        },
        pinnedColumns: {
          method: 'right',
          stale: 'left',
        },
        sort: {
          key: 'stale',
          order: 'asc',
        },
      },
    })).toEqual({
      columnOrder: ['status', 'name', 'method'],
      columnVisibility: {
        name: true,
        status: false,
        method: true,
      },
      columnWidths: {
        name: 200,
      },
      pinnedColumns: {
        method: 'right',
      },
      pageSize: 25,
      sort: undefined,
    })
  })

  it('merges configured column order with remaining known columns', () => {
    expect(mergeColumnOrder(['status', 'stale', 'status'], ['name', 'status', 'method'])).toEqual([
      'status',
      'name',
      'method',
    ])
  })

  it('builds ag-grid column state from config and header defaults', () => {
    expect(buildColumnStateFromConfig({
      headers,
      config: normalizeTableConfig({
        columnOrder: ['status', 'name'],
        columnVisibility: { status: false },
        columnWidths: { status: 120 },
        pinnedColumns: { status: 'right' },
        sort: { key: 'status', order: 'asc' },
      }),
    })).toEqual([
      {
        colId: 'status',
        hide: true,
        pinned: 'right',
        sort: 'asc',
        width: 120,
      },
      {
        colId: 'name',
        hide: undefined,
        pinned: 'left',
        sort: null,
        width: 200,
      },
    ])
  })

  it('allows config to explicitly unpin a default-pinned header', () => {
    expect(buildColumnStateFromConfig({
      headers,
      config: normalizeTableConfig({
        columnOrder: ['name', 'status'],
        pinnedColumns: { name: false },
      }),
    }).find(column => column.colId === 'name')?.pinned).toBe(null)
  })

  it('extracts table config from ag-grid state', () => {
    const api = {
      getColumnState: () => [
        { colId: 'ag-Grid-SelectionColumn', hide: false, width: 48, pinned: 'left' },
        { colId: 'name', hide: false, width: 180, pinned: 'left' },
        { colId: 'status', hide: true, width: 120, pinned: null, sort: 'desc' },
      ],
    } as GridApi<TestRow>

    expect(getConfigFromGrid({ api, headers, pageSize: 25 })).toEqual({
      columnOrder: ['name', 'status'],
      columnVisibility: {
        name: true,
        status: false,
      },
      columnWidths: {
        name: 180,
        status: 120,
      },
      pinnedColumns: {
        name: 'left',
        status: false,
      },
      sort: {
        key: 'status',
        order: 'desc',
      },
      pageSize: 25,
    })
  })

  it('omits sort when no ag-grid column is sorted', () => {
    const api = {
      getColumnState: () => [
        { colId: 'name', hide: false, width: 180, pinned: null },
      ],
    } as GridApi<TestRow>

    expect(getConfigFromGrid({ api, headers, pageSize: 25 }).sort).toBeUndefined()
  })

  it('compares normalized configs across persisted fields', () => {
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig(),
      normalizeTableConfig(),
    )).toBe(true)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columnVisibility: { name: true } }),
      normalizeTableConfig({ columnVisibility: { name: false } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columnOrder: ['name', 'status'] }),
      normalizeTableConfig({ columnOrder: ['status', 'name'] }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columnWidths: { name: 100 } }),
      normalizeTableConfig({ columnWidths: { name: 120 } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ pinnedColumns: { name: 'left' } }),
      normalizeTableConfig({ pinnedColumns: { name: false } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ pinnedColumns: { name: false } }),
      normalizeTableConfig(),
    )).toBe(true)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ sort: { key: 'name', order: 'asc' } }),
      normalizeTableConfig({ sort: { key: 'name', order: 'desc' } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ pageSize: 25 }),
      normalizeTableConfig({ pageSize: 50 }),
    )).toBe(false)
  })
})

describe('datatable fetcher utilities', () => {
  const createPaginationFetcherParamSources = () => ({
    mode: computed(() => 'pagination' as const),
    pageSize: computed(() => 15),
    search: computed(() => undefined),
    sort: computed(() => undefined),
    filterSelection: computed(() => undefined),
  })

  it('only commits the latest pagination request result', async () => {
    const createDeferred = <Value>() => {
      let deferredResolve!: (value: Value) => void
      const promise = new Promise<Value>((resolve) => {
        deferredResolve = resolve
      })

      return { promise, resolve: deferredResolve }
    }
    const firstRequest = createDeferred<{
      data: TestRow[]
      total: number
    }>()
    const secondRequest = createDeferred<{
      data: TestRow[]
      total: number
    }>()
    const fetcher = vi.fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)
    const {
      currentPage,
      fetchPage,
      rowData,
      totalRows,
    } = useAnalyticsDatatableFetchers<TestRow>({
      fetcher: ref(fetcher as AnalyticsDatatableFetcher<TestRow>),
      fetcherParams: createPaginationFetcherParamSources(),
    })

    const firstFetch = fetchPage(1)
    const secondFetch = fetchPage(2)
    secondRequest.resolve({
      data: [{ id: 'row-2', name: 'Second', status: 200 }],
      total: 2,
    })
    await secondFetch
    firstRequest.resolve({
      data: [{ id: 'row-1', name: 'First', status: 200 }],
      total: 1,
    })
    await firstFetch

    expect(rowData.value).toEqual([{ id: 'row-2', name: 'Second', status: 200 }])
    expect(totalRows.value).toBe(2)
    expect(currentPage.value).toBe(2)
  })

  it('uses the latest fetcher ref when fetching', async () => {
    const initialFetcher = vi.fn().mockResolvedValue({
      data: [{ id: 'row-1', name: 'Initial', status: 200 }],
      total: 1,
    })
    const latestFetcher = vi.fn().mockResolvedValue({
      data: [{ id: 'row-2', name: 'Latest', status: 200 }],
      total: 1,
    })
    const fetcher = ref<AnalyticsDatatableFetcher<TestRow>>(initialFetcher)
    const {
      fetchPage,
      rowData,
    } = useAnalyticsDatatableFetchers<TestRow>({
      fetcher,
      fetcherParams: createPaginationFetcherParamSources(),
    })

    fetcher.value = latestFetcher
    await fetchPage(1)

    expect(initialFetcher).not.toHaveBeenCalled()
    expect(latestFetcher).toHaveBeenCalledOnce()
    expect(rowData.value).toEqual([{ id: 'row-2', name: 'Latest', status: 200 }])
  })
})

describe('datatable pagination utilities', () => {
  const createPagination = ({
    activePageSize = ref(15),
    isFetching = ref(false),
    currentPage = ref(1),
    totalRows = ref<number>(),
    hasNextPageWhenTotalUnknown = ref(false),
    fetchPage = vi.fn(),
  } = {}) => ({
    fetchPage,
    pagination: useDatatablePagination({
      activePageSize,
      isFetching,
      fetchPage,
      currentPage,
      totalRows,
      hasNextPageWhenTotalUnknown,
    }),
  })

  it('guards invalid, current, fetching, and out-of-bounds page requests', () => {
    const fetchPage = vi.fn()
    const { pagination } = createPagination({
      fetchPage,
      isFetching: ref(true),
      currentPage: ref(2),
      totalRows: ref(30),
    })

    pagination.goToPage(0)
    pagination.goToPage(2)
    pagination.goToPage(3)

    expect(fetchPage).not.toHaveBeenCalled()
  })

  it('allows previous pages and known-total next pages in bounds', () => {
    const { fetchPage, pagination } = createPagination({
      currentPage: ref(2),
      totalRows: ref(40),
    })

    expect(pagination.hasKnownTotalRows.value).toBe(true)
    expect(pagination.canGoPreviousPage.value).toBe(true)
    expect(pagination.canGoNextPage.value).toBe(true)

    pagination.goToPage(1)
    pagination.onPageChange({ page: 3, pageCount: 3, firstItem: 31, lastItem: 40, visibleItems: [] })

    expect(fetchPage).toHaveBeenCalledWith(1)
    expect(fetchPage).toHaveBeenCalledWith(3)
  })

  it('uses unknown-total has-next state when total rows are omitted', () => {
    const hasNextPageWhenTotalUnknown = ref(false)
    const { fetchPage, pagination } = createPagination({
      hasNextPageWhenTotalUnknown,
    })

    expect(pagination.hasKnownTotalRows.value).toBe(false)
    expect(pagination.canGoNextPage.value).toBe(false)
    pagination.goToPage(2)
    expect(fetchPage).not.toHaveBeenCalled()

    hasNextPageWhenTotalUnknown.value = true
    expect(pagination.canGoNextPage.value).toBe(true)
    pagination.goToPage(2)
    expect(fetchPage).toHaveBeenCalledWith(2)
  })
})
