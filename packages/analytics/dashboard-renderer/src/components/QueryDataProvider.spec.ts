import { ref } from 'vue'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import QueryDataProvider from './QueryDataProvider.vue'
import { INJECT_QUERY_PROVIDER } from '../constants'
import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'

const swrvData = ref<any>(undefined)
const swrvError = ref<any>(null)
const swrvIsValidating = ref(false)

let mockedFetcher: (() => Promise<any>) | undefined
let mockedKey: (() => string | null) | undefined

function setSwrvState(opts: { data?: any, error?: any, isValidating?: boolean } = {}) {
  swrvData.value = opts.data && { key: mockedKey?.(), result: opts.data }
  swrvError.value = opts.error
  swrvIsValidating.value = !!opts.isValidating
}

function resetSwrvState() {
  setSwrvState({ data: undefined, error: null, isValidating: false })
}

vi.mock('swrv', () => ({
  default: (key: any, fetcher: any) => {
    mockedKey = key
    // Like swrv, call the fetcher with the key resolved at fetch time
    mockedFetcher = () => fetcher(key())

    return {
      data: swrvData,
      error: swrvError,
      isValidating: swrvIsValidating,
    }
  },
}))

vi.mock('@kong-ui-public/analytics-config-store', () => ({
  useDatasourceConfigStore: vi.fn(),
}))

const defaultProps = {
  context: {
    filters: [],
    timeSpec: { type: 'relative', time_range: '15m' },
    editable: false,
    tz: '',
    refreshInterval: 0,
  },
  query: {
    datasource: 'api_usage',
    metrics: [],
    filters: [],
  },
  queryReady: true,
  refreshCounter: 0,
} as any

const mountProvider = (opts: { queryFn?: any } = {}) => mount(QueryDataProvider, {
  props: defaultProps,
  global: {
    provide: {
      [INJECT_QUERY_PROVIDER]: {
        queryFn: opts.queryFn ?? vi.fn(),
      },
    },
    stubs: {
      KSkeleton: {
        template: '<div data-testid="chart-skeleton" />',
      },
      KEmptyState: {
        template: '<div data-testid="chart-empty-state"><slot name="title" /></div>',
      },
    },
  },
  slots: {
    default: `
      <template #default="{ data }">
        <div data-testid="slot-content">{{ data.data[0].timestamp }}</div>
      </template>
    `,
  },
})

const deferred = () => {
  let resolveFn!: (v: any) => void
  let rejectFn!: (e: any) => void

  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })

  return { promise, resolve: resolveFn, reject: rejectFn }
}

const canceledError = { code: 'ERR_CANCELED', name: 'CanceledError', message: 'canceled' }

describe('QueryDataProvider', () => {
  beforeEach(() => {
    resetSwrvState()
    mockedFetcher = undefined
    mockedKey = undefined
    vi.mocked(useDatasourceConfigStore).mockReturnValue({
      datasourceConfigMap: ref({}),
      isReady: vi.fn().mockResolvedValue(undefined),
      stripUnknownFilters: ref(({ filters }: { filters: any[] }) => filters),
    } as any)
  })

  it('shows fallback error message when queryError is null', async () => {
    // Simulates swrv entering ERROR without the fetcher throwing
    setSwrvState({ error: new Error('swrv internal error') })

    const wrapper = mountProvider()

    await flushPromises()

    expect(wrapper.findTestId('chart-empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('An unexpected error has occurred.')
  })

  it('drops rejections from superseded queries', async () => {
    const request = deferred()
    const wrapper = mountProvider({ queryFn: vi.fn().mockReturnValue(request.promise) })

    const fetchPromise = mockedFetcher!()

    // Change the query so the fetch's key no longer matches the current one.
    await wrapper.setProps({ query: { ...defaultProps.query, dimensions: ['route'] } })

    request.reject(canceledError)

    // The stale rejection resolves to undefined instead of propagating.
    await expect(fetchPromise).resolves.toBeUndefined()
    await flushPromises()

    expect(wrapper.findTestId('chart-empty-state').exists()).toBe(false)
    expect(wrapper.findTestId('chart-skeleton').exists()).toBe(true)
  })

  it('discards results from superseded queries', async () => {
    const request = deferred()
    const wrapper = mountProvider({ queryFn: vi.fn().mockReturnValue(request.promise) })

    const fetchPromise = mockedFetcher!()

    await wrapper.setProps({ query: { ...defaultProps.query, dimensions: ['route'] } })

    request.resolve({ data: [{ timestamp: 'stale' }], meta: {} })

    await expect(fetchPromise).resolves.toBeUndefined()
  })

  it('shows "Request canceled" when the current query is canceled', async () => {
    const wrapper = mountProvider({ queryFn: vi.fn().mockRejectedValue(canceledError) })

    await expect(mockedFetcher!()).rejects.toEqual(canceledError)

    setSwrvState({ error: canceledError })
    await flushPromises()

    expect(wrapper.findTestId('chart-empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Request canceled')
  })

  it('keeps showing previous data while a new query loads', async () => {
    const result = { data: [{ timestamp: 'now' }], meta: {} }
    const wrapper = mountProvider()

    setSwrvState({ data: result })
    await flushPromises()

    expect(wrapper.findTestId('slot-content').exists()).toBe(true)
    expect(wrapper.emitted('chart-data')).toBeTruthy()

    // Simluate a new query but the previous data should be shown while loading
    setSwrvState({ data: undefined, isValidating: true })
    await flushPromises()

    expect(wrapper.findTestId('slot-content').exists()).toBe(true)
    expect(wrapper.findTestId('slot-content').text()).toContain('now')
    expect(wrapper.findTestId('chart-skeleton').exists()).toBe(false)
  })

  it('marks previous data as loading until the new query resolves', async () => {
    const wrapper = mountProvider()

    setSwrvState({ data: { data: [{ timestamp: 'now' }], meta: {} } })
    await flushPromises()

    expect(wrapper.findTestId('loading-overlay').attributes('aria-busy')).toBe('false')

    // swrv keeps the previous key's data while the new key is fetched
    swrvIsValidating.value = true
    await wrapper.setProps({ query: { ...defaultProps.query, dimensions: ['route'] } })
    await flushPromises()

    expect(wrapper.findTestId('slot-content').text()).toContain('now')
    expect(wrapper.findTestId('loading-overlay').attributes('aria-busy')).toBe('true')

    setSwrvState({ data: { data: [{ timestamp: 'later' }], meta: {} } })
    await flushPromises()

    expect(wrapper.findTestId('slot-content').text()).toContain('later')
    expect(wrapper.findTestId('loading-overlay').attributes('aria-busy')).toBe('false')
  })

  it('does not mark data as loading during a background revalidation', async () => {
    const result = { data: [{ timestamp: 'now' }], meta: {} }
    const wrapper = mountProvider()

    setSwrvState({ data: result })
    await flushPromises()

    // Autorefresh keeps the current data while revalidating
    setSwrvState({ data: result, isValidating: true })
    await flushPromises()

    expect(wrapper.findTestId('loading-overlay').attributes('aria-busy')).toBe('false')
  })

  it('shows the skeleton instead of previous data when the query is not ready', async () => {
    const result = { data: [{ timestamp: 'now' }], meta: {} }
    const wrapper = mountProvider()

    setSwrvState({ data: result })
    await flushPromises()

    expect(wrapper.findTestId('slot-content').exists()).toBe(true)

    setSwrvState({ data: undefined, isValidating: true })
    await wrapper.setProps({ queryReady: false })
    await flushPromises()

    expect(wrapper.findTestId('slot-content').exists()).toBe(false)
    expect(wrapper.findTestId('chart-skeleton').exists()).toBe(true)
  })

  it('shows a settled error for the current query even when previous data exists', async () => {
    const result = { data: [{ timestamp: 'now' }], meta: {} }
    const wrapper = mountProvider({ queryFn: vi.fn().mockRejectedValue({ status: 403 }) })

    setSwrvState({ data: result })
    await flushPromises()

    expect(wrapper.findTestId('slot-content').exists()).toBe(true)

    await expect(mockedFetcher!()).rejects.toEqual({ status: 403 })
    setSwrvState({ data: undefined, error: { status: 403 } })
    await flushPromises()

    expect(wrapper.findTestId('chart-empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('Data request forbidden')
    expect(wrapper.findTestId('slot-content').exists()).toBe(false)
  })
})
