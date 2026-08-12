import type { AxiosInstance } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useReferenceEntityNames } from './useReferenceEntityNames'
import type { KonnectPluginEntityConfig } from '../types'

describe('useReferenceEntityNames', () => {
  let axiosInstance: Pick<AxiosInstance, 'get'>
  let onError: ReturnType<typeof vi.fn>

  const konnectConfig: KonnectPluginEntityConfig = {
    app: 'konnect',
    apiBaseUrl: '/us/kong-api',
    controlPlaneId: 'test-cp-id',
    entityId: 'plugin-1',
    pluginType: 'rate-limiting',
  }

  beforeEach(() => {
    axiosInstance = { get: vi.fn() }
    onError = vi.fn()
  })

  it('fetches the name for each reference field present on the entity', async () => {
    vi.mocked(axiosInstance.get).mockImplementation((url: string) => {
      if (url.includes('/services/')) return Promise.resolve({ data: { id: 'service-1', name: 'my-service' } })
      if (url.includes('/routes/')) return Promise.resolve({ data: { id: 'route-1', name: 'my-route' } })
      return Promise.resolve({ data: {} })
    })

    const { resolveReferenceNames, withReferenceName } = useReferenceEntityNames({
      config: konnectConfig,
      axiosInstance: axiosInstance as AxiosInstance,
      onError,
    })

    resolveReferenceNames({
      service: { id: 'service-1' },
      route: { id: 'route-1' },
      consumer: null,
      consumer_group: null,
    })

    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/us/kong-api/v2/control-planes/test-cp-id/core-entities/services/service-1',
    )
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/us/kong-api/v2/control-planes/test-cp-id/core-entities/routes/route-1',
    )
    expect(axiosInstance.get).toHaveBeenCalledTimes(2)

    // wait for both in-flight requests to resolve
    await vi.waitFor(() => {
      expect(withReferenceName('service', 'service-1')).toBe('service-1/my-service')
      expect(withReferenceName('route', 'route-1')).toBe('route-1/my-route')
    })
  })

  it('skips fields with no id', () => {
    const { resolveReferenceNames } = useReferenceEntityNames({
      config: konnectConfig,
      axiosInstance: axiosInstance as AxiosInstance,
      onError,
    })

    resolveReferenceNames({ service: null, route: null, consumer: null, consumer_group: null })

    expect(axiosInstance.get).not.toHaveBeenCalled()
  })

  it('uses username for consumers', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValue({ data: { id: 'consumer-1', username: 'jdoe', custom_id: 'ext-1' } })

    const { resolveReferenceNames, withReferenceName } = useReferenceEntityNames({
      config: konnectConfig,
      axiosInstance: axiosInstance as AxiosInstance,
      onError,
    })

    resolveReferenceNames({ consumer: { id: 'consumer-1' } })

    await vi.waitFor(() => {
      expect(withReferenceName('consumer', 'consumer-1')).toBe('consumer-1/jdoe')
    })
  })

  it('reports loading state per field and calls onError on failure', async () => {
    let rejectRequest: (err: unknown) => void = () => {}
    vi.mocked(axiosInstance.get).mockImplementation(() => new Promise((resolve, reject) => {
      rejectRequest = reject
    }))

    const { resolveReferenceNames, isReferenceNameLoading, withReferenceName } = useReferenceEntityNames({
      config: konnectConfig,
      axiosInstance: axiosInstance as AxiosInstance,
      onError,
    })

    resolveReferenceNames({ service: { id: 'service-1' } })

    expect(isReferenceNameLoading('service')).toBe(true)
    expect(isReferenceNameLoading('route')).toBe(false)

    const error = new Error('boom')
    rejectRequest(error)

    await vi.waitFor(() => {
      expect(isReferenceNameLoading('service')).toBe(false)
    })

    expect(onError).toHaveBeenCalledWith(error)
    // falls back to bare id since the name never resolved
    expect(withReferenceName('service', 'service-1')).toBe('service-1')
  })
})
