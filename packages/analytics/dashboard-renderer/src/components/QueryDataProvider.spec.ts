import { ref } from 'vue'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import QueryDataProvider from './QueryDataProvider.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'

const swrvData = ref<any>(undefined)
const swrvError = ref<any>(null)
const swrvIsValidating = ref(false)

function setSwrvState(opts: { data?: any, error?: any, isValidating?: boolean } = {}) {
  swrvData.value = opts.data
  swrvError.value = opts.error
  swrvIsValidating.value = !!opts.isValidating
}

function resetSwrvState() {
  setSwrvState({ data: undefined, error: null, isValidating: false })
}

vi.mock('swrv', () => ({
  default: () => ({
    data: swrvData,
    error: swrvError,
    isValidating: swrvIsValidating,
  }),
}))

describe('QueryDataProvider', () => {
  beforeEach(() => {
    resetSwrvState()
  })

  it('shows fallback error message when queryError is null', async () => {
    // Simulates swrv entering ERROR without the fetcher throwing
    setSwrvState({ error: new Error('swrv internal error') })

    const wrapper = mount(QueryDataProvider, {
      props: {
        context: {
          filters: [],
          timeSpec: { type: 'relative', time_range: '15m' },
          editable: false,
          tz: '',
          refreshInterval: 0,
          zoomable: false,
        },
        query: {
          datasource: 'api_usage',
          metrics: [],
          filters: [],
        },
        queryReady: true,
        refreshCounter: 0,
      },
      global: {
        provide: {
          [INJECT_QUERY_PROVIDER]: {
            queryFn: vi.fn(),
          },
        },
        stubs: {
          KSkeleton: true,
          KEmptyState: {
            template: '<div data-testid="chart-empty-state"><slot name="title" /></div>',
          },
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('[data-testid="chart-empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('An unexpected error has occurred.')
  })
})
