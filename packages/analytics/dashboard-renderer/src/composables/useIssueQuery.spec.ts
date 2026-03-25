import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
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
  const mockStore = {
    isReady: vi.fn().mockResolvedValue(undefined),
    stripUnknownFilters: ({ filters }: { filters: AllFilters[] } ) => filters,
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

  it('passes through unknown datasources as-is', async () => {
    vi.mocked(useDatasourceConfigStore).mockReturnValue(mockStore)
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
    vi.mocked(useDatasourceConfigStore).mockReturnValue(mockStore)
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
})
