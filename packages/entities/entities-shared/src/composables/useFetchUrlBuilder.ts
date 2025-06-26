import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type {
  KongManagerBaseTableConfig,
  KonnectBaseTableConfig,
} from '../types'
import type { MaybeRef } from '../types/utils'
import type { TableDataFetcherParams } from '@kong/kongponents'

export default function useFetchUrlBuilder(
  config: MaybeRefOrGetter<KonnectBaseTableConfig | KongManagerBaseTableConfig>,
  baseUrl: MaybeRef<string>,
) {
  const isExactMatch = computed((): boolean => {
    const configValue = toValue(config)
    return configValue.app === 'konnect' || !!configValue.isExactMatch
  })

  // Construct a URL object, adding the current `window.location.origin` if the path begins with a slash
  const baseRequestUrl = computed((): URL => {
    const baseUrlValue = toValue(baseUrl)
    return baseUrlValue.startsWith('/')
      ? new URL(`${window.location.origin}${baseUrlValue}`)
      : new URL(baseUrlValue)
  })

  return (fetcherParams: TableDataFetcherParams) => {
    const { page, pageSize, offset, sortColumnKey, sortColumnOrder, query } = fetcherParams

    // This is done within a try/catch block in case there is an error in constructing the URL; the fallback value will still fetch but without the params
    try {
      let urlWithParams: URL = new URL(baseRequestUrl.value.href)
      if (isExactMatch.value && query) {
        // handle
        // 1) all konnect usage or
        // 2) kongManager usage with config.isExactMatch === true
        urlWithParams.search = '' // trim any query params
        urlWithParams = toValue(config).isExactMatch
          ? new URL(`${urlWithParams.href}/${query}`)
          : new URL(`${urlWithParams.href}?filter[name][contains]=${query}`)
      } else {
        // handle kongManager usage with config.isExactMatch === false
        if (!isExactMatch.value) {
          // Using fuzzy match
          new URLSearchParams(query).forEach((value, key) => {
            urlWithParams.searchParams.append(key, value)
          })
        }

        // Sort parameters
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        sortColumnKey && urlWithParams.searchParams.append('sort_by', sortColumnKey)

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
      return toValue(baseUrl)
    }
  }
}
