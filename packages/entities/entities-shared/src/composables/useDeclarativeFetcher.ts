import type { TableDataFetcherParams } from '@kong/kongponents'
import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import { FetcherStatus, type DeclarativeConfig, type DeclarativeRoute, type DeclarativeRouteSortableKey, type FetcherResponse, type FetcherState } from '../types'
import { useFetcherCacheKey } from './useFetcher'

export function useDeclarativeRoutesFetcher(
  config: MaybeRefOrGetter<DeclarativeConfig | undefined>,
  cacheIdentifier: string,
  filterFn: (route: DeclarativeRoute) => boolean,
) {
  const state = ref<FetcherState>({
    status: FetcherStatus.Idle,
  })
  const fetcherCacheKey = useFetcherCacheKey(cacheIdentifier)

  const fetcher = async (fetcherParams: TableDataFetcherParams): Promise<FetcherResponse> => {
    // Note: Declarative fetchers do not have an InitialLoad status
    state.value = { status: FetcherStatus.Loading }

    try {
      const configValue = toValue(config)
      if (!configValue) {
        const response: FetcherResponse = {
          data: [],
          total: 0,
        }

        state.value = {
          status: FetcherStatus.NoRecords,
          response,
        }

        return response
      }

      let results = configValue.routes.filter(filterFn)

      if (fetcherParams.sortColumnKey) {
        const sortKey = fetcherParams.sortColumnKey as DeclarativeRouteSortableKey
        switch (sortKey) {
          case 'name':
            results = results.sort((a, b) =>
              fetcherParams.sortColumnOrder === 'desc'
                ? b.name.localeCompare(a.name)
                : a.name.localeCompare(b.name),
            )
            break
          case 'match':
            results = results.sort((a, b) =>
              fetcherParams.sortColumnOrder === 'desc'
                ? b.match.path.localeCompare(a.match.path)
                : a.match.path.localeCompare(b.match.path),
            )
            break
          default:
            throw new Error(`Unsupported sortColumnKey "${fetcherParams.sortColumnKey}"`)
        }
      }

      let pagination: FetcherResponse['pagination'] | undefined = undefined
      if (fetcherParams.pageSize) {
        const pageSize = fetcherParams.pageSize
        if (pageSize < 1 || !Number.isInteger(pageSize)) {
          throw new Error(`Expected pageSize to be a positive integer, got ${fetcherParams.pageSize}`)
        }

        const page = fetcherParams.page ?? 1
        if (page < 1 || !Number.isInteger(page)) {
          throw new Error(`Expected page to be a positive integer, got ${page}`)
        }

        pagination = { offset: 'page' }

        results = results.slice((page - 1) * pageSize, page * pageSize)
      }

      const response = {
        data: results,
        total: configValue.routes.length,
        pagination,
      }

      if (results.length === 0 && !fetcherParams.query) {
        state.value = {
          status: FetcherStatus.NoRecords,
          response,
        }
      } else {
        state.value = {
          status: FetcherStatus.Idle,
          response,
        }
      }

      return response
    } catch (error: any) {
      const response: FetcherResponse = {
        data: [],
        total: 0,
      }

      state.value = {
        status: FetcherStatus.Error,
        response,
        error: error.response ? error : { response: error },
      }

      return response
    }
  }

  return {
    fetcher,
    fetcherState: state,
    fetcherCacheKey,
  }
}
