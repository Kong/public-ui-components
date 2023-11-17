import { computed, ref, unref } from 'vue'
import type {
  FetcherParams,
  KongManagerBaseTableConfig,
  KonnectBaseTableConfig,
} from '../types'
import type { MaybeRef } from '../types/utils'

export default function useFetchUrlBuilder(
  config: MaybeRef<KonnectBaseTableConfig | KongManagerBaseTableConfig>,
  baseUrl: MaybeRef<string>,
) {
  const _config = ref(unref(config))
  const _baseUrl = ref(unref(baseUrl))

  const isExactMatch = computed(
    (): boolean => !!(_config.value.app === 'konnect' || _config.value.isExactMatch),
  )

  // Construct a URL object, adding the current `window.location.origin` if the path begins with a slash
  const baseRequestUrl = computed((): URL =>
    _baseUrl.value.startsWith('/')
      ? new URL(`${window.location.origin}${_baseUrl.value}`)
      : new URL(_baseUrl.value),
  )

  return (fetcherParams: FetcherParams) => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page, pageSize, offset, sortColumnKey, sortColumnOrder, query } = fetcherParams

    // This is done within a try/catch block in case there is an error in constructing the URL; the fallback value will still fetch but without the params
    try {
      let urlWithParams: URL = new URL(baseRequestUrl.value.href)
      if (isExactMatch.value && query) {
        // Using exact match
        urlWithParams.search = '' // trim any query params
        urlWithParams = new URL(`${urlWithParams.href}?filter[name][contains]=${query}`)
      } else {
        if (!isExactMatch.value) {
          // Using fuzzy match
          new URLSearchParams(query).forEach((value, key) => {
            urlWithParams.searchParams.append(key, value)
          })
        }

        // Sort parameters
        sortColumnKey &&
          urlWithParams.searchParams.append('sort_by', sortColumnKey)

        if (sortColumnOrder === 'desc') {
          urlWithParams.searchParams.append('sort_desc', '1')
        }
        urlWithParams.searchParams.append('size', String(pageSize))
      }

      // Offset parameter: Only send the offset if we are not on the first page
      if (offset && page !== 1) {
        urlWithParams.searchParams.append('offset', String(offset))
      }

      return urlWithParams.href
    } catch (err) {
      console.error('RouteList(fetcher)', err)

      // Fallback to returning the URL without the added params
      return _baseUrl.value
    }
  }
}
