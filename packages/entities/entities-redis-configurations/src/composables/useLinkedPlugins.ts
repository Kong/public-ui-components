import { useAxios, type KongManagerConfig, type KonnectConfig } from '@kong-ui-public/entities-shared'
import { ref, watch } from 'vue'
import useSwrv from 'swrv'

import endpoints from '../partials-endpoints'

import type { RedisConfigurationLinkedPluginsResponse } from '../types'

type RequestParams = {
  partialId: string
  size?: number,
  offset?: string | null,
  query?: string,
}

export function buildLinksCacheKey(partialId: string) {
  return `redis-partial-links-${partialId}`
}

export const useLinkedPluginsFetcher = (config: KonnectConfig | KongManagerConfig) => {
  const { axiosInstance } = useAxios(config.axiosRequestConfig)

  return {
    fetcher: async (params: RequestParams) => {
      const { partialId, size, offset, query } = params
      let url = `${config.apiBaseUrl}${endpoints.links[config.app]}`

      if (config.app === 'konnect') {
        url = url.replace(/{controlPlaneId}/gi, config?.controlPlaneId || '')
      } else if (config.app === 'kongManager') {
        url = url.replace(/\/{workspace}/gi, config?.workspace ? `/${config.workspace}` : '')
      }

      // Always replace the id when editing
      url = url.replace(/{id}/gi, partialId || '')

      if (query) {
        url = `${url}?${query}`
      }

      const { data } = await axiosInstance.get<RedisConfigurationLinkedPluginsResponse>(
        url,
        { params: { size, offset } },
      )
      // todo(zehao): remove this when the backend is fixed
      // https://kongstrong.slack.com/archives/C0663589T3R/p1739519613780909?thread_ts=1739446191.148239&cid=C0663589T3R
      if (data && !Array.isArray(data.data)) {
        data.data = []
      }
      data.total = data.total || data.data.length // todo(zehao): remove this line when BE provides `total` field
      return data
    },
  }
}

export const useLinkedPlugins = (param: {
  partialId: string,
  config: KonnectConfig | KongManagerConfig,
  requestParams?: RequestParams,
}) => {
  const { partialId, config } = param

  const { fetcher } = useLinkedPluginsFetcher(config)
  const result = ref<RedisConfigurationLinkedPluginsResponse['data']>([])
  const { data } = useSwrv(
    buildLinksCacheKey(partialId),
    () => fetcher({ partialId }),
    {
      revalidateOnFocus: false,
    },
  )

  watch(data, () => {
    result.value = data.value?.data ?? []
  })

  return result
}
