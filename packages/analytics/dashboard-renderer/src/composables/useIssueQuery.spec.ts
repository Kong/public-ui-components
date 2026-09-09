import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import useIssueQuery from './useIssueQuery'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { AllFilters, AnalyticsBridge } from '@kong-ui-public/analytics-utilities'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'

vi.mock('@kong-ui-public/analytics-config-store', () => ({
  useDatasourceConfigStore: vi.fn(),
}))

const mountComposable = (queryBridge: AnalyticsBridge) => {
  const wrapper = mount(defineComponent({
    setup() {
      return useIssueQuery()
    },
    template: '<div />',
  }), {
    global: {
      provide: {
        [INJECT_QUERY_PROVIDER]: queryBridge,
      },
    },
  })

  return wrapper
}

describe('useIssueQuery', () => {
  const mockStripUnknownFilters = vi.fn(({ filters }: { filters: AllFilters[] }) => {
    return filters.filter(({ field }) => field !== 'unsupported_field')
  })

  const mockStore = {
    datasourceConfigMap: ref({
      managed_cache_usage: {
        timeRangeOptions: ['15m', '1h', '6h', '12h', '24h', '7d'],
      },
    }),
    isReady: vi.fn().mockResolvedValue(undefined),
    stripUnknownFilters: ref(mockStripUnknownFilters),
  } as any

  const context: any = {
    filters: [
      {
        field: 'gateway_service',
        operator: 'in',
        value: ['example-service'],
      },
    ],
    timeSpec: {
      type: 'relative',
      time_range: '15m',
    },
    editable: false,
    tz: 'UTC',
    refreshInterval: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDatasourceConfigStore).mockReturnValue(mockStore)
  })

  it('passes through unknown datasources as-is', async () => {
    const queryFn = vi.fn().mockResolvedValue({})
    const wrapper = mountComposable({
      queryFn,
    } as any)

    await wrapper.vm.issueQuery({
      datasource: 'custom_datasource',
      metrics: [],
      dimensions: [],
      filters: [],
    } as any, context)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn.mock.calls[0][0]).toMatchObject({
      datasource: 'custom_datasource',
      query: {
        filters: [
          {
            field: 'gateway_service',
            operator: 'in',
            value: ['example-service'],
          },
        ],
      },
    })
  })

  it('keeps the basic fallback when datasource is omitted', async () => {
    const queryFn = vi.fn().mockResolvedValue({})
    const wrapper = mountComposable({
      queryFn,
    } as any)

    await wrapper.vm.issueQuery({
      metrics: [],
      dimensions: [],
      filters: [],
    } as any, context)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn.mock.calls[0][0]).toMatchObject({
      datasource: 'basic',
    })
  })

  it('limits a relative context timeframe to the datasource maximum', async () => {
    const queryFn = vi.fn().mockResolvedValue({})
    const wrapper = mountComposable({
      queryFn,
    } as any)

    await wrapper.vm.issueQuery({
      datasource: 'managed_cache_usage',
      metrics: [],
      dimensions: [],
      filters: [],
    } as any, {
      ...context,
      timeSpec: {
        type: 'relative',
        time_range: '30d',
      },
    })

    expect(queryFn.mock.calls[0][0]).toMatchObject({
      query: {
        time_range: {
          type: 'relative',
          time_range: '7d',
          tz: 'UTC',
        },
      },
    })
  })

  it('limits an absolute tile timeframe while preserving its end', async () => {
    const queryFn = vi.fn().mockResolvedValue({})
    const wrapper = mountComposable({
      queryFn,
    } as any)
    const end = new Date('2024-01-30T00:00:00Z')

    await wrapper.vm.issueQuery({
      datasource: 'managed_cache_usage',
      metrics: [],
      dimensions: [],
      filters: [],
      time_range: {
        type: 'absolute',
        start: new Date('2024-01-01T00:00:00Z'),
        end,
      },
    } as any, context)

    expect(queryFn.mock.calls[0][0].query.time_range).toEqual({
      type: 'absolute',
      start: new Date('2024-01-23T00:00:00Z'),
      end,
      tz: 'UTC',
    })
  })

  it('prunes invalid filters from the merged query and context filters', async () => {
    const invalidQueryFilter = {
      field: 'unsupported_field',
      operator: 'in',
      value: ['200'],
    }
    const validContextFilter = {
      field: 'gateway_service',
      operator: 'in',
      value: ['example-service'],
    }

    const queryFn = vi.fn().mockResolvedValue({})
    const wrapper = mountComposable({
      queryFn,
    } as any)

    await wrapper.vm.issueQuery({
      metrics: [],
      dimensions: [],
      filters: [invalidQueryFilter],
    } as any, {
      ...context,
      filters: [validContextFilter],
    })

    expect(mockStripUnknownFilters).toHaveBeenCalledWith(expect.objectContaining({
      datasource: 'basic',
      filters: [invalidQueryFilter, validContextFilter],
      queryFields: [],
    }))
    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn.mock.calls[0][0]).toMatchObject({
      query: {
        filters: [validContextFilter],
      },
    })
  })

  // TODO(MA-5255): Remove these tests with the temporary frontend shim when platform
  // aggregation queries support `empty` and `not_empty` filters.
  describe('non-table platform aggregation filter shim', () => {
    it.each(['platform_usage', 'platform'])('strips empty operators from %s query filters', async (datasource) => {
      const queryFn = vi.fn().mockResolvedValue({})
      const wrapper = mountComposable({
        queryFn,
      } as any)
      const inFilter = {
        field: 'name',
        operator: 'in',
        value: ['example'],
      }
      const notInFilter = {
        field: 'name',
        operator: 'not_in',
        value: ['other'],
      }

      await wrapper.vm.issueQuery({
        datasource,
        metrics: [],
        dimensions: [],
        filters: [
          { field: 'name', operator: 'empty' },
          { field: 'name', operator: 'not_empty' },
          inFilter,
          notInFilter,
        ],
      } as any, {
        ...context,
        filters: [],
      })

      expect(queryFn.mock.calls[0][0]).toMatchObject({
        query: {
          filters: [inFilter, notInFilter],
        },
      })
    })

    it.each(['platform_usage', 'platform'])('strips empty operators from %s context filters', async (datasource) => {
      const queryFn = vi.fn().mockResolvedValue({})
      const wrapper = mountComposable({
        queryFn,
      } as any)
      const inFilter = {
        field: 'name',
        operator: 'in',
        value: ['example'],
      }

      await wrapper.vm.issueQuery({
        datasource,
        metrics: [],
        dimensions: [],
        filters: [],
      } as any, {
        ...context,
        filters: [
          { field: 'name', operator: 'empty' },
          { field: 'name', operator: 'not_empty' },
          inFilter,
        ],
      })

      expect(queryFn.mock.calls[0][0]).toMatchObject({
        query: {
          filters: [inFilter],
        },
      })
    })

    it('preserves empty operators for non-platform datasources', async () => {
      const queryFn = vi.fn().mockResolvedValue({})
      const wrapper = mountComposable({
        queryFn,
      } as any)
      const filters = [
        { field: 'name', operator: 'empty' },
        { field: 'name', operator: 'not_empty' },
      ]

      await wrapper.vm.issueQuery({
        datasource: 'custom_datasource',
        metrics: [],
        dimensions: [],
        filters,
      } as any, {
        ...context,
        filters: [],
      })

      expect(queryFn.mock.calls[0][0]).toMatchObject({
        query: {
          filters,
        },
      })
    })
  })

  it('aborts the previous occurring query when a new one is issued', async () => {
    const queryFn = vi.fn().mockReturnValue(new Promise(() => {}))
    const wrapper = mountComposable({
      queryFn,
    } as any)

    const query: any = { metrics: [], dimensions: [], filters: [] }
    wrapper.vm.issueQuery(query, context)
    wrapper.vm.issueQuery(query, context)
    await flushPromises()

    expect(queryFn).toHaveBeenCalledTimes(2)
    expect((queryFn.mock.calls[0][1] as AbortController).signal.aborted).toBe(true)
    expect((queryFn.mock.calls[1][1] as AbortController).signal.aborted).toBe(false)
  })

  it('aborts the query on unmount', async () => {
    const queryFn = vi.fn().mockReturnValue(new Promise(() => {}))
    const wrapper = mountComposable({
      queryFn,
    } as any)

    wrapper.vm.issueQuery({ metrics: [], dimensions: [], filters: [] } as any, context)
    await flushPromises()
    const controller = queryFn.mock.calls[0][1] as AbortController
    expect(controller.signal.aborted).toBe(false)

    wrapper.unmount()
    expect(controller.signal.aborted).toBe(true)
  })
})
