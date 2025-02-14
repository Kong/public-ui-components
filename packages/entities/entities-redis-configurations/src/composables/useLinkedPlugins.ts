import { useAxios, type KongManagerConfig, type KonnectConfig } from '@kong-ui-public/entities-shared'
import { computed, onBeforeMount, ref } from 'vue'
import endpoints from '../partials-endpoints'
import type { RedisConfigurationLinkedPlugin, RedisConfigurationLinkedPluginsResponse } from '../types'

type RequestParams = {
  size?: number,
  offset?: string | null,
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
      // todo(zehao): use swrv?
      const { data } = await axiosInstance.get<RedisConfigurationLinkedPluginsResponse>(linksUrl.value, { params })
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

  const links = ref<RedisConfigurationLinkedPlugin[]>([])
  const { fetcher } = useLinkedPluginsFetcher({ partialId, config })

  onBeforeMount(async () => {
    try {
      const { data } = await fetcher(param.requestParams)
      links.value = data
    } catch (e) {
      if (e instanceof Error) {
        // log error to DD
        console.error('Failed to fetch linked plugins', partialId, e.message)
      }
    }
  })

  return links
}
