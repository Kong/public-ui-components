import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import useIssueQuery from './useIssueQuery'
import { INJECT_QUERY_PROVIDER } from '../constants'
import type { AnalyticsBridge, DashboardRendererContextInternal, ValidDashboardQuery } from '@kong-ui-public/analytics-utilities'

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
  const context: DashboardRendererContextInternal = {
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

  it('falls back to api_usage for unknown datasources', async () => {
    const queryFn = vi.fn().mockResolvedValue({})
    const wrapper = mountComposable({
      queryFn,
    } as AnalyticsBridge)

    await wrapper.vm.issueQuery({
      datasource: 'custom_datasource',
      metrics: [],
      dimensions: [],
      filters: [],
    } as ValidDashboardQuery, context)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn.mock.calls[0][0]).toMatchObject({
      datasource: 'api_usage',
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
    } as AnalyticsBridge)

    await wrapper.vm.issueQuery({
      metrics: [],
      dimensions: [],
      filters: [],
    } as ValidDashboardQuery, context)

    expect(queryFn).toHaveBeenCalledOnce()
    expect(queryFn.mock.calls[0][0]).toMatchObject({
      datasource: 'basic',
    })
  })
})
