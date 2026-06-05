import type { TableDataGridFetcher } from '../types'
import type {
  TableDataGridFetchModeSources,
  TableDataGridFetchParams,
} from '../types/internal'
import { computed, type Ref } from 'vue'
import { useTableDataGridFetchState } from '../composables/useTableDataGridFetchState'

export type TestRow = {
  id: string
  name: string
  status: number
}

export const createRows = (prefix: string, length: number): TestRow[] => (
  Array.from({ length }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    name: `${prefix} ${index + 1}`,
    status: 200,
  }))
)

export const createDeferred = <Value>() => {
  let deferredResolve!: (value: Value) => void
  const promise = new Promise<Value>((resolve) => {
    deferredResolve = resolve
  })

  return { promise, resolve: deferredResolve }
}

export const createPaginationFetchParams = (): TableDataGridFetchParams => ({
  mode: computed(() => 'pagination' as const),
  pageSize: computed(() => 15),
  search: computed(() => undefined),
  sortColumnKey: computed(() => undefined),
  sortColumnOrder: computed(() => undefined),
  filterSelection: computed(() => undefined),
})

export const createInfiniteFetchParams = (): TableDataGridFetchParams => ({
  mode: computed(() => 'infinite' as const),
  pageSize: computed(() => 15),
  search: computed(() => undefined),
  sortColumnKey: computed(() => undefined),
  sortColumnOrder: computed(() => undefined),
  filterSelection: computed(() => undefined),
})

export const createFetchHarness = ({
  fetcher,
  params,
}: {
  fetcher: Ref<TableDataGridFetcher<TestRow>>
  params: TableDataGridFetchParams
}) => {
  const fetchState = useTableDataGridFetchState<TestRow>()

  const sources: TableDataGridFetchModeSources<TestRow> = {
    fetcher,
    params,
    state: fetchState,
  }

  return {
    sources,
    ...fetchState,
  }
}
