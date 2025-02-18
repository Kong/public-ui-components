import { useAxios, type KongManagerConfig, type KonnectConfig } from '@kong-ui-public/entities-shared'
import { computed, ref, watch } from 'vue'
import useSwrv from 'swrv'
import endpoints from '../partials-endpoints'
import type { RedisConfigurationLinkedPluginsResponse } from '../types'

type RequestParams = {
  size?: number,
  offset?: string | null,
}

export function buildLinksCacheKey(partialId: string) {
  return `redis-partial-links-${partialId}`
}

export const useLinkedPluginsFetcher = (param: {
  partialId: string,
  config: KonnectConfig | KongManagerConfig,
}) => {
  const { partialId, config } = param
  const { axiosInstance } = useAxios(config.axiosRequestConfig)

  const linksUrl = computed(() => {
    let url = `${config.apiBaseUrl}${endpoints.links[config.app].all}`

    if (config.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, config?.controlPlaneId || '')
    } else if (config.app === 'kongManager') {
      url = url.replace(/\/{workspace}/gi, config?.workspace ? `/${config.workspace}` : '')
    }

    // Always replace the id when editing
    url = url.replace(/{id}/gi, partialId || '')
    return url
  })

  return {
    fetcher: async (params?: RequestParams) => {
      const { data } = await axiosInstance.get<RedisConfigurationLinkedPluginsResponse>(linksUrl.value, { params })
      // todo(zehao): remove this when the backend is fixed
      // https://kongstrong.slack.com/archives/C0663589T3R/p1739519613780909?thread_ts=1739446191.148239&cid=C0663589T3R
      if (data && !Array.isArray(data.data)) {
        data.data = []
      }
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

  const { fetcher } = useLinkedPluginsFetcher({ partialId, config })
  const { data } = useSwrv(buildLinksCacheKey(partialId), () => fetcher())
  const result = ref<RedisConfigurationLinkedPluginsResponse['data']>([])

  watch(data, () => {
    result.value = data.value?.data ?? []
  })

  return result
}
