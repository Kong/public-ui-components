import { useAxios, AppType, type KongManagerConfig, type KonnectConfig } from '@kong-ui-public/entities-shared'
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

      if (config.app === AppType.Konnect) {
        url = url.replace(/{controlPlaneId}/gi, config?.controlPlaneId || '')
      } else if (config.app === AppType.KongManager) {
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
