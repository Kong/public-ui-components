import type { AllFilters, AnalyticsBridge, ApiRequestsQuery, ApiRequestsResult } from '@kong-ui-public/analytics-utilities'
import type { DashboardRendererContext } from '../types'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'

import useIssueRequestsQuery from './useIssueRequestsQuery'
import { INJECT_QUERY_PROVIDER } from '../constants'

vi.mock('@kong-ui-public/analytics-config-store', () => ({
  useDatasourceConfigStore: vi.fn(),
}))

const page = (size: number, cursor?: string): ApiRequestsResult => ({
  results: Array.from({ length: size }, (_, i) => ({ request_start: '2024-06-16T00:00:00.000Z', latencies_response_ms: i })),
  meta: { query_id: '', time_range: { start: '', end: '' }, size, ...(cursor && { cursor }) },
})

const mountComposable = (queryBridge: Partial<AnalyticsBridge>) => mount(defineComponent({
  setup: () => useIssueRequestsQuery(),
  template: '<div />',
}), {
  global: { provide: { [INJECT_QUERY_PROVIDER]: queryBridge } },
})

describe('useIssueRequestsQuery', () => {
  const query: ApiRequestsQuery = { datasource: 'requests', metric: 'latencies_response_ms' }

  const context: DashboardRendererContext = {
    filters: [{ field: 'gateway_service', operator: 'in', value: ['example-service'] }] as AllFilters[],
    timeSpec: { type: 'relative', time_range: '30d' },
    tz: 'UTC',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDatasourceConfigStore).mockReturnValue({
      datasourceConfigMap: ref({ requests: { timeRangeOptions: ['15m', '1h', '6h', '12h', '24h', '7d'] } }),
      isReady: vi.fn().mockResolvedValue(undefined),
      stripUnknownFilters: ref(({ filters }: { filters: AllFilters[] }) => filters.filter(({ field }) => field !== 'unsupported_field')),
    } as any)
  })

  it('throws when the bridge cannot fetch request records', async () => {
    const wrapper = mountComposable({})

    await expect(wrapper.vm.issueRequestsQuery(query, context)).rejects.toThrow('Query bridge cannot fetch request records')
  })

  it('merges tile and context filters, dropping unsupported ones', async () => {
    const requestsQueryFn = vi.fn().mockResolvedValue(page(1))
    const wrapper = mountComposable({ requestsQueryFn })

    await wrapper.vm.issueRequestsQuery({
      ...query,
      filters: [
        { field: 'status_code', operator: 'in', value: [500] },
        { field: 'unsupported_field', operator: 'in', value: ['x'] },
      ],
    } as ApiRequestsQuery, context)

    expect(requestsQueryFn.mock.calls[0][0]).toMatchObject({
      datasource: 'requests',
      query: {
        filters: [
          { field: 'status_code', operator: 'in', value: [500] },
          { field: 'gateway_service', operator: 'in', value: ['example-service'] },
        ],
      },
    })
  })

  it('limits the context time range and converts it for the requests endpoint', async () => {
    const requestsQueryFn = vi.fn().mockResolvedValue(page(1))
    const wrapper = mountComposable({ requestsQueryFn })

    await wrapper.vm.issueRequestsQuery(query, context)

    expect(requestsQueryFn.mock.calls[0][0].query.time_range).toEqual({ type: 'relative', time_range: '7D', tz: 'UTC' })
  })

  it('prefers the tile time range over the context', async () => {
    const requestsQueryFn = vi.fn().mockResolvedValue(page(1))
    const wrapper = mountComposable({ requestsQueryFn })

    await wrapper.vm.issueRequestsQuery({ ...query, time_range: { type: 'relative', time_range: '1h' } } as ApiRequestsQuery, context)

    expect(requestsQueryFn.mock.calls[0][0].query.time_range).toEqual({ type: 'relative', time_range: '1H', tz: 'UTC' })
  })

  it('caps the records fetched at the tile max_records', async () => {
    const requestsQueryFn = vi.fn().mockResolvedValue(page(3, 'next'))
    const wrapper = mountComposable({ requestsQueryFn })

    const result = await wrapper.vm.issueRequestsQuery({ ...query, max_records: 3 }, context)

    expect(requestsQueryFn.mock.calls[0][0].query.size).toBe(3)
    expect(result).toMatchObject({ truncated: true, limit: 3 })
  })

  it('aborts the previous request when a new one starts', async () => {
    const requestsQueryFn = vi.fn().mockResolvedValue(page(1))
    const wrapper = mountComposable({ requestsQueryFn })

    await wrapper.vm.issueRequestsQuery(query, context)
    await wrapper.vm.issueRequestsQuery(query, context)

    const [firstController, secondController] = requestsQueryFn.mock.calls.map(([, controller]) => controller as AbortController)

    expect(firstController.signal.aborted).toBe(true)
    expect(secondController.signal.aborted).toBe(false)
  })

  it('aborts the in-flight request on unmount', async () => {
    const requestsQueryFn = vi.fn().mockResolvedValue(page(1))
    const wrapper = mountComposable({ requestsQueryFn })

    await wrapper.vm.issueRequestsQuery(query, context)
    wrapper.unmount()

    expect((requestsQueryFn.mock.calls[0][1] as AbortController).signal.aborted).toBe(true)
  })
})
