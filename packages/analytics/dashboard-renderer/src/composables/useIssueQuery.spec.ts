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
    zoomable: false,
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
