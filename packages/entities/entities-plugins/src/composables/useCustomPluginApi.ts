import type { AxiosInstance } from 'axios'
import { isAxiosError } from 'axios'
import endpoints from '../plugins-endpoints'
import type {
  ClonedPluginRequestBody,
  ClonedPluginResponse,
  InstalledPluginRequestBody,
  InstalledPluginResponse,
  StreamedPluginRequestBody,
  StreamedPluginResponse,
} from '../types'

/** Symbol key used to indicate which type a plugin was resolved as */
export const CUSTOM_PLUGIN_TYPE_KEY = Symbol('customPluginType')

export type CustomPluginWithType =
  | (InstalledPluginResponse & { [CUSTOM_PLUGIN_TYPE_KEY]: 'installed' })
  | (StreamedPluginResponse & { [CUSTOM_PLUGIN_TYPE_KEY]: 'streamed' })
  | (ClonedPluginResponse & { [CUSTOM_PLUGIN_TYPE_KEY]: 'cloned' })

interface UseKonnectCustomPluginApiOptions {
  app: 'konnect'
  controlPlaneId: string
  workspace?: string
}

interface UseKongManagerCustomPluginApiOptions {
  app: 'kongManager'
  workspace: string
}

type UseCustomPluginApiOptions = (
  UseKonnectCustomPluginApiOptions
  | UseKongManagerCustomPluginApiOptions
) & {
  axiosInstance: AxiosInstance
  apiBaseUrl: string
}

export function useCustomPluginApi(options: UseCustomPluginApiOptions) {
  const { axiosInstance, apiBaseUrl } = options

  const assertKonnectInstalledApi = (): void => {
    if (options.app !== 'konnect') {
      throw new Error('Installed custom plugin APIs are only available for Konnect')
    }
  }

  const buildUrl = (endpointTemplate: string, pluginId?: string): string => {
    let url = `${apiBaseUrl}${endpointTemplate}`


    if (options.app === 'konnect') {
      url = url.replace(/{controlPlaneId}/gi, options.controlPlaneId)
    }

    url = url
      .replace(/{pluginId}/gi, pluginId ?? '')
      .replace(/\/{workspace}/gi, options.workspace ? `/${options.workspace}` : '')

    return url
  }

  // ── Installed (Konnect only) ──

  const getInstalledPlugin = async (pluginId: string): Promise<InstalledPluginResponse> => {
    assertKonnectInstalledApi()
    const url = buildUrl(endpoints.customPlugin.konnect.installed.edit, pluginId)
    const { data } = await axiosInstance.get<InstalledPluginResponse>(url)
    return data
  }

  const createInstalledPlugin = async (body: InstalledPluginRequestBody): Promise<InstalledPluginResponse> => {
    assertKonnectInstalledApi()
    const url = buildUrl(endpoints.customPlugin.konnect.installed.create)
    const { data } = await axiosInstance.post<InstalledPluginResponse>(url, body)
    return data
  }

  const updateInstalledPlugin = async (pluginId: string, body: InstalledPluginRequestBody): Promise<InstalledPluginResponse> => {
    assertKonnectInstalledApi()
    const url = buildUrl(endpoints.customPlugin.konnect.installed.edit, pluginId)
    const { data } = await axiosInstance.put<InstalledPluginResponse>(url, body)
    return data
  }

  // ── Streamed ──

  const getStreamedPlugin = async (pluginId: string): Promise<StreamedPluginResponse> => {
    const url = buildUrl(endpoints.customPlugin[options.app].streamed.edit, pluginId)
    const { data } = await axiosInstance.get<StreamedPluginResponse>(url)
    return data
  }

  const createStreamedPlugin = async (body: StreamedPluginRequestBody): Promise<StreamedPluginResponse> => {
    const url = buildUrl(endpoints.customPlugin[options.app].streamed.create)
    const { data } = await axiosInstance.post<StreamedPluginResponse>(url, body)
    return data
  }

  const updateStreamedPlugin = async (pluginId: string, body: StreamedPluginRequestBody): Promise<StreamedPluginResponse> => {
    const url = buildUrl(endpoints.customPlugin[options.app].streamed.edit, pluginId)
    const method = options.app === 'konnect' ? 'put' : 'patch'
    const { data } = await axiosInstance[method]<StreamedPluginResponse>(url, body)
    return data
  }

  // ── Cloned ──

  const createClonedPlugin = async (body: ClonedPluginRequestBody): Promise<ClonedPluginResponse> => {
    const { aliasName: alias, priority, sourcePlugin: link } = body
    const url = buildUrl(endpoints.customPlugin[options.app].cloned.create, alias)
    const { data } = await axiosInstance.put<ClonedPluginResponse>(url, {
      link,
      priority,
    })
    return data
  }

  const updateClonedPlugin = async (originName: string, body: ClonedPluginRequestBody): Promise<ClonedPluginResponse> => {
    const { aliasName: alias, priority, sourcePlugin: link } = body
    const url = buildUrl(endpoints.customPlugin[options.app].cloned.edit, originName)
    const { data } = await axiosInstance.patch<ClonedPluginResponse>(url, {
      link,
      priority,
      name: alias,
    })
    return data
  }

  const getClonedPlugin = async (pluginId: string): Promise<ClonedPluginResponse> => {
    const url = buildUrl(endpoints.customPlugin[options.app].cloned.edit, pluginId)
    const { data } = await axiosInstance.get<ClonedPluginResponse>(url)
    return data
  }

  // ── Resolve by unknown type ──

  /**
   * Fetch a custom plugin by ID without knowing its type.
   * Tries installed → streamed → cloned in order.
   * Returns the response with a Symbol field indicating the resolved type, or null if not found.
   */
  const getPluginByUnknownType = async (pluginId: string): Promise<CustomPluginWithType | null> => {
    // Try installed
    if (options.app === 'konnect') {
      try {
        const data = await getInstalledPlugin(pluginId)
        return Object.assign(data, { [CUSTOM_PLUGIN_TYPE_KEY]: 'installed' as const })
      } catch (e: unknown) {
        // not installed, continue
        if (isAxiosError(e) && e.response?.status !== 404) {
          throw e
        }
      }
    }

    // Try streamed
    try {
      const data = await getStreamedPlugin(pluginId)
      return Object.assign(data, { [CUSTOM_PLUGIN_TYPE_KEY]: 'streamed' as const })
    } catch (e: unknown) {
      // not streamed, continue
      if (isAxiosError(e) && e.response?.status !== 404) {
        throw e
      }
    }

    try {
      const data = await getClonedPlugin(pluginId)
      return Object.assign(data, { [CUSTOM_PLUGIN_TYPE_KEY]: 'cloned' as const })
    } catch (e: unknown) {
      // not cloned, continue
      if (isAxiosError(e) && e.response?.status !== 404) {
        throw e
      }

    }

    return null
  }

  const getPluginType = (plugin: CustomPluginWithType): 'installed' | 'streamed' | 'cloned' => {
    return plugin[CUSTOM_PLUGIN_TYPE_KEY]
  }

  return {
    getInstalledPlugin,
    createInstalledPlugin,
    updateInstalledPlugin,
    getStreamedPlugin,
    createStreamedPlugin,
    updateStreamedPlugin,
    getPluginByUnknownType,
    getPluginType,
    getClonedPlugin,
    createClonedPlugin,
    updateClonedPlugin,
  }
}
