import { ref, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type {
  FetcherResponse,
  FetcherState,
  KongManagerBaseTableConfig,
  KonnectBaseTableConfig,
  MaybeRef,
} from '../types'
import { FetcherStatus } from '../types'
import useAxios from './useAxios'
import useFetchUrlBuilder from './useFetchUrlBuilder'
import type { TableDataFetcherParams } from '@kong/kongponents'

// Store cacheIdentifier => fetcherCacheKey globally so that the cache is persisted during the session
const cacheKeys = new Map<string, Ref<number>>()

export default function useFetcher(
  configRef: MaybeRefOrGetter<KonnectBaseTableConfig | KongManagerBaseTableConfig>,
  baseUrl: MaybeRef<string>,
  /**
   * Special handling for a response structure with a different base key for the data array like
   * { consumers: [{ ... }] }
   * instead of the standard the majority of the endpoints have
   * { data: [{ ... }] }
   */
  dataKeyNameRef?: MaybeRefOrGetter<string | undefined>,
) {
  const initialLoad = ref<boolean>(true)
  const config = toValue(configRef)

  const { axiosInstance } = useAxios(config.axiosRequestConfig)
  const buildFetchUrl = useFetchUrlBuilder(configRef, baseUrl)

  const state = ref<FetcherState>({
    status: FetcherStatus.Idle,
  })

  const fetcher = async (fetcherParams: TableDataFetcherParams): Promise<FetcherResponse> => {
    const dataKeyName = toValue(dataKeyNameRef) || 'data'
    try {
      state.value = initialLoad.value ? { status: FetcherStatus.InitialLoad } : { status: FetcherStatus.Loading }
      initialLoad.value = false

      let requestUrl = buildFetchUrl(fetcherParams)

      // support for new filtering
      if (requestUrl.includes('filter[name]')) {
        requestUrl = `${requestUrl}&page[size]=${fetcherParams.pageSize}&page[number]=${fetcherParams.page}`
      }

      const res = await axiosInstance.get(requestUrl)
      // If the host app treats 4xx and 5xx responses as resolved through its validateStatus,
      // we need to throw the error to trigger the catch block
      // because we still need to show the error UI accordingly.
      if (res.status >= 400) {
        throw res
      }

      const data = res.data
      const dataKey = (dataKeyName && dataKeyName.replace(/[^\w-_]/gi, ''))
      let tableData


      if (data[dataKey]) {
        tableData = Array.isArray(data[dataKey]) ? data[dataKey] : [data[dataKey]]
      } else if (Array.isArray(data)) {
        // An array of object is returned
        tableData = data
      } else {
        // Single object is returned, so wrap in an array
        tableData = Object.keys(data).length ? [data] : []
      }

      const response = {
        data: tableData,
        total: tableData.length,
        ...(data.offset
          ? {
            pagination: {
              offset: data.offset,
            },
          }
          : null),
      }

      if (response.data.length === 0 && !fetcherParams.query) {
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
      const response = {
        data: [],
        total: 0,
      }

      // If response is 404, and there is a filterQuery, show no results instead of error
      if (fetcherParams.query && (error.response?.status === 404 || error.status === 404)) {
        state.value = {
          status: FetcherStatus.NoResults,
          response,
          error: error.response ? error : { response: error },
        }

        return response
      }

      state.value = {
        status: FetcherStatus.Error,
        response,
        error: error.response ? error : { response: error },
      }

      return response
    }
  }

  const cacheId = config.cacheIdentifier
  const fetcherCacheKey = useFetcherCacheKey(cacheId)

  return { fetcher, fetcherState: state, fetcherCacheKey }
}

export function useFetcherCacheKey(cacheId?: string) {
  if (cacheId) {
    let key = cacheKeys.get(cacheId)
    if (!key) {
      key = ref(1)
      cacheKeys.set(cacheId, key)
    }
    return key
  }

  return ref(1)
}
