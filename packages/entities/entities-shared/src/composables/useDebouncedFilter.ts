import { ref, unref } from 'vue'
import { useDebounce } from '@kong-ui-public/core'
import type {
  KongManagerBaseTableConfig,
  KongManagerBaseFormConfig,
  KonnectBaseTableConfig,
  KonnectBaseFormConfig,
  MaybeRef, FilterKeys,
} from '../types'
import useAxios from './useAxios'
import useI18n from './useI18n'
import useHelpers from './useHelpers'

export default function useDebouncedFilter(
  config: KonnectBaseFormConfig | KongManagerBaseFormConfig | KonnectBaseTableConfig | KongManagerBaseTableConfig,
  baseUrl: MaybeRef<string>,
  size?: string,
  keys: FilterKeys = {
    fetchedItemsKey: 'data',
    searchKeys: ['id'],
  },
) {
  // size defaulted to 100 in hopes of retrieving all available
  // entries until better server-side filtering is offered
  if (!size) {
    size = '100'
  }

  // Is this reactive?
  const { axiosInstance } = useAxios({
    headers: config.requestHeaders,
  })

  const { i18n: { t } } = useI18n()
  const { debounce } = useDebounce()
  const debouncedQueryChange = debounce(async (query: string) => {
    await fetchExistingItems(query)
  }, 200)

  const loading = ref(false)
  const error = ref('')
  const validationError = ref('')
  const results = ref<Record<string, any>[]>([])
  const resultsCache = ref<Record<string, any>[]>([])
  const allRecords = ref<Record<string, any>[] | undefined>(undefined)

  const _baseUrl = unref(baseUrl)
  let url = `${config.apiBaseUrl}${_baseUrl}`

  if (config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, config?.controlPlaneId || '')
  } else if (config.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, config?.workspace ? `/${config.workspace}` : '')
  }

  const { isValidUuid } = useHelpers()

  // Handle initial load of records and determine filter type
  const loadItems = async (): Promise<void> => {
    try {
      // Trigger the loading state
      loading.value = true

      const { data }: Record<string, any> = await axiosInstance.get(`${url}?size=${size}`)

      // determine if we've got all of the available records or not
      // to determine how we handle filtering
      if (!data?.next) {
        allRecords.value = (keys.fetchedItemsKey in data) ? data[keys.fetchedItemsKey] : []
      }

      resultsCache.value = (keys.fetchedItemsKey in data) ? data[keys.fetchedItemsKey] : []
      results.value = resultsCache.value
    } catch (_error: any) {
      results.value = []
      error.value = t('debouncedFilter.errors.fetch')
    } finally {
      // Reset the loading state
      loading.value = false
    }
  }

  // using this to skip unnecessary fetch fired on focus
  const previousQuery = ref('')
  const fetchExistingItems = async (query?: string): Promise<void> => {
    // using this to skip unnecessary fetch fired on focus
    if (previousQuery.value === query) {
      return
    } else {
      previousQuery.value = query || ''
    }

    // if records are paginated, use the API
    if (allRecords.value === undefined) {
      try {
        // Trigger the element's loading state
        loading.value = true
        error.value = ''
        validationError.value = ''

        if (config.app === 'konnect') { // KoKo only supports exact match
          // If user has typed info in the query field
          let currUrl = url + '' // clone
          if (query) {
            currUrl += `/${query}`
          }

          const { data }: Record<string, any> = await axiosInstance.get(`${currUrl}?size=${size}`)

          if (keys.fetchedItemsKey in data) {
            results.value = data[keys.fetchedItemsKey]
          } else if (data?.id) { // exact match
            results.value = [data]
          } else {
            results.value = []
          }
        } else if (query) { // Admin API supports filtering on specific fields
          const promises = []

          if (isValidUuid(query) && keys.searchKeys.includes('id')) {
            // If query is a valid UUID, do the exact search
            promises.push((async () => {
              const { data } = await axiosInstance.get(`${url}/${query}`)
              return [data[keys.fetchedItemsKey] ?? data]
            })())
          } else {
            // Search on fields with backend filtering support
            promises.push(
              ...keys.searchKeys
                .filter(key => key !== 'id')
                .map(async key => {
                  const { data } = await axiosInstance.get(`${url}?${key}=${query}`)
                  return data[keys.fetchedItemsKey]
                }),
            )
          }

          const resolvedArray = await Promise.all(promises)
          const dedupedIds = new Set()
          results.value = []
          resolvedArray?.forEach?.((resolvedItems: Array<Record<string, any>>) => {
            resolvedItems?.forEach?.(item => {
              if (!dedupedIds.has(item.id)) {
                dedupedIds.add(item.id)
                results.value.push(item)
              }
            })
          })
        } else {
          results.value = resultsCache.value
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          validationError.value = t('debouncedFilter.errors.invalid')
        } else {
          results.value = []
          error.value = t('debouncedFilter.errors.fetch')
        }
      } finally {
        // Reset the element's loading state
        loading.value = false
      }
    } else { // we have all the records, so client side filtering is fine
      // Trigger the loading state
      loading.value = true
      validationError.value = ''

      // If user has typed info in the query field
      if (query) {
        results.value = allRecords.value?.filter((record: Record<string, any>) => {
          let res = false
          for (const k of keys.searchKeys) {
            const value = typeof record[k] === 'string' ? record[k]?.toLowerCase() : record[k]
            if (value?.includes(query.toLowerCase())) {
              res = true
            }
          }

          return res
        })

        if (!results.value || !results.value.length) {
          validationError.value = t('debouncedFilter.errors.invalid')
        }
      } else { // reset to all records
        results.value = allRecords.value
      }

      loading.value = false
    }
  }

  return {
    loading,
    error,
    validationError,
    results,
    allRecords,
    loadItems,
    debouncedQueryChange,
  }
}
