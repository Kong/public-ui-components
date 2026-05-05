import type { AxiosInstance } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCustomPluginApi } from './useCustomPluginApi'

describe('useCustomPluginApi', () => {
  let axiosInstance: Pick<AxiosInstance, 'get' | 'post' | 'put' | 'patch'>

  beforeEach(() => {
    axiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    }
  })

  it('uses PUT for installed plugin updates on Konnect', async () => {
    const response = {
      item: {
        lua_schema: 'return {}',
        name: 'my-plugin',
        created_at: 1700000000,
        updated_at: 1700000001,
      },
    }
    vi.mocked(axiosInstance.put).mockResolvedValue({ data: response })

    const api = useCustomPluginApi({
      axiosInstance: axiosInstance as AxiosInstance,
      apiBaseUrl: '/us/kong-api',
      app: 'konnect',
      controlPlaneId: 'test-cp-id',
    })

    await expect(api.updateInstalledPlugin('my-plugin', { lua_schema: 'return {}' })).resolves.toEqual(response)
    expect(axiosInstance.put).toHaveBeenCalledWith(
      '/us/kong-api/v2/control-planes/test-cp-id/core-entities/plugin-schemas/my-plugin',
      { lua_schema: 'return {}' },
    )
    expect(axiosInstance.patch).not.toHaveBeenCalled()
  })

  it('throws when installed plugin APIs are called for Kong Manager', async () => {
    const api = useCustomPluginApi({
      axiosInstance: axiosInstance as AxiosInstance,
      apiBaseUrl: '/kong-manager',
      app: 'kongManager',
      workspace: 'default',
    })

    await expect(api.getInstalledPlugin('my-plugin')).rejects.toThrow('Installed custom plugin APIs are only available for Konnect')
    await expect(api.createInstalledPlugin({ lua_schema: 'return {}' })).rejects.toThrow('Installed custom plugin APIs are only available for Konnect')
    await expect(api.updateInstalledPlugin('my-plugin', { lua_schema: 'return {}' })).rejects.toThrow('Installed custom plugin APIs are only available for Konnect')
    expect(axiosInstance.get).not.toHaveBeenCalled()
    expect(axiosInstance.post).not.toHaveBeenCalled()
    expect(axiosInstance.put).not.toHaveBeenCalled()
    expect(axiosInstance.patch).not.toHaveBeenCalled()
  })
})