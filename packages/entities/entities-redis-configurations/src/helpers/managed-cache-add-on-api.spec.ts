import { describe, expect, it, vi } from 'vitest'

import { fetchAllManagedCacheAddOns, fetchManagedCacheAddOnById, fetchRedisPartialForConfigCard } from './managed-cache-add-on-api'

describe('fetchManagedCacheAddOnById', () => {
  it('returns add-on when cp matches', async () => {
    const axiosInstance = {
      get: vi.fn(async () => ({
        data: {
          id: 'addon-1',
          name: 'redis-cache-primary',
          config: { kind: 'managed-cache.v0' },
          owner: { control_plane_id: 'cp-1' },
        },
      })),
    }

    const out = await fetchManagedCacheAddOnById(axiosInstance, 'https://cg.example', 'addon-1', 'cp-1')

    expect(out).toMatchObject({ id: 'addon-1', config: { kind: 'managed-cache.v0' } })
    expect(axiosInstance.get).toHaveBeenCalledWith('https://cg.example/v2/cloud-gateways/add-ons/addon-1')
  })

  it('returns null when cp does not match', async () => {
    const axiosInstance = {
      get: vi.fn(async () => ({
        data: {
          id: 'addon-1',
          config: { kind: 'managed-cache.v0' },
          owner: { control_plane_id: 'cp-2' },
        },
      })),
    }

    expect(await fetchManagedCacheAddOnById(axiosInstance, 'https://cg.example', 'addon-1', 'cp-1')).toBeNull()
  })
})

describe('fetchAllManagedCacheAddOns', () => {
  it('returns first page when only one page exists', async () => {
    const axiosInstance = {
      get: vi.fn(async () => ({
        data: {
          data: [
            {
              id: 'addon-1',
              config: { kind: 'managed-cache.v0' },
              owner: { control_plane_id: 'cp-1' },
            },
          ],
          meta: { page: { total_pages: 1 } },
        },
      })),
    }

    const list = await fetchAllManagedCacheAddOns(axiosInstance, 'https://cg.example', 'cp-1')

    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('addon-1')
    expect(axiosInstance.get).toHaveBeenCalledTimes(1)
  })

  it('fetches page 2 when more pages exist', async () => {
    const pageSize = 100
    const page1Rows = Array.from({ length: pageSize }, (_, i) => ({
      id: `addon-${i}`,
      config: { kind: 'managed-cache.v0' },
    }))
    const page2Rows = [{ id: 'addon-next', config: { kind: 'managed-cache.v0' } }]

    const get = vi.fn(async (_url: string, opts?: { params?: Record<string, unknown> }) => {
      if (opts?.params?.['page[number]'] === 1) {
        return { data: { data: page1Rows, meta: { page: { total_pages: 2 } } } }
      }
      return { data: { data: page2Rows, meta: { page: { total_pages: 2 } } } }
    })
    const axiosInstance = { get }

    const list = await fetchAllManagedCacheAddOns(axiosInstance, 'https://cg.example', 'cp-1')

    expect(list).toHaveLength(pageSize + 1)
    expect(list[pageSize].id).toBe('addon-next')
    expect(get).toHaveBeenCalledTimes(2)
    expect(get.mock.calls[0][1]?.params?.['page[number]']).toBe(1)
    expect(get.mock.calls[1][1]?.params?.['page[number]']).toBe(2)
  })
})

describe('fetchRedisPartialForConfigCard', () => {
  it('accepts redis-ee from payload', async () => {
    const axiosInstance = {
      get: vi.fn(async () => ({
        data: {
          data: {
            id: 'partial-1',
            type: 'redis-ee',
            name: 'r1',
            tags: [],
            config: {},
            created_at: 1,
            updated_at: 1,
          },
        },
      })),
    }

    const out = await fetchRedisPartialForConfigCard(axiosInstance, 'https://api.example', 'cp-1', 'partial-1')
    expect(out?.id).toBe('partial-1')
    expect(out?.type).toBe('redis-ee')
  })

  it('returns null for non-redis entity type', async () => {
    const axiosInstance = {
      get: vi.fn(async () => ({
        data: { data: { id: 'svc-1', type: 'service' } },
      })),
    }

    expect(await fetchRedisPartialForConfigCard(axiosInstance, 'https://api.example', 'cp-1', 'svc-1')).toBeNull()
  })
})
