import type { TableDataGridFetcher } from '../types'
import type {
  TableDataGridFetchModeSources,
  TableDataGridFetchParams,
} from '../types/internal'
import type { IDatasource } from 'ag-grid-community'
import { computed, ref, shallowRef, type Ref } from 'vue'

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
  const pendingFetchCount = ref(0)
  const currentPage = ref(1)
  const datasource = ref<IDatasource>()
  const fetchError = ref<unknown>()
  const hasFetched = ref(false)
  const hasNextPageWhenTotalUnknown = ref(false)
  const rowData = shallowRef<TestRow[]>([])
  const totalRows = ref<number>()

  const markFetchStarted = () => {
    fetchError.value = undefined
    pendingFetchCount.value += 1
  }

  const markFetchFinished = ({ markFetched = true }: { markFetched?: boolean } = {}) => {
    pendingFetchCount.value = Math.max(0, pendingFetchCount.value - 1)
    if (!markFetched) {
      return
    }

    hasFetched.value = true
  }

  const resetFetched = () => {
    hasFetched.value = false
  }

  const state: TableDataGridFetchModeSources<TestRow>['state'] = {
    currentPage,
    datasource,
    fetchError,
    hasFetched,
    hasNextPageWhenTotalUnknown,
    markFetchStarted,
    markFetchFinished,
    rowData,
    totalRows,
  }
  const isFetching = computed(() => pendingFetchCount.value > 0)

  const sources: TableDataGridFetchModeSources<TestRow> = {
    fetcher,
    params,
    state,
  }

  return {
    isFetching,
    resetFetched,
    sources,
    ...state,
  }
}
