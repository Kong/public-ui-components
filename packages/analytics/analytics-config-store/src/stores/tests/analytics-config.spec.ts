import { setupPiniaTestStore } from './setupPiniaTestStore'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnalyticsConfigStore } from '../analytics-config'
import type { App } from 'vue'
import { nextTick } from 'vue'

describe('useAnalyticsConfigStore', () => {
  let app: App | undefined
  const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

  beforeEach(() => {
    app = setupPiniaTestStore({ createVueApp: true })
  })

  const useStore = ({
    hasPercentiles = false,
    reject = false,
  }: {
    hasPercentiles?: boolean
    reject?: boolean
  } = {}) => {
    const configFn = vi.fn(() => {
      return reject
        ? Promise.reject()
        : Promise.resolve({
          analytics: {
            percentiles: hasPercentiles,
          },
          requests: null,
        })
    })

    if (app) {
      app.provide(INJECT_QUERY_PROVIDER, { configFn })
    }

    return useAnalyticsConfigStore()
  }

  it('when store values are read before ready, they evaluate to false', async () => {
    const store = useStore({
      hasPercentiles: true,
    })

    expect(store.loading).toBe(true)
    expect(store.analytics).toBe(false)
    expect(store.percentiles).toBe(false)

    // wait for the app to exist
    await nextTick()

    expect(store.loading).toBe(false)
    expect(store.analytics).toBe(true)
    expect(store.percentiles).toBe(true)
  })

  it('can await the isReady function for config values to be loaded', async () => {
    const store = useStore({
      hasPercentiles: true,
    })

    expect(store.loading).toBe(true)
    expect(store.analytics).toBe(false)
    expect(store.percentiles).toBe(false)

    await store.isReady()

    expect(store.loading).toBe(false)
    expect(store.analytics).toBe(true)
    expect(store.percentiles).toBe(true)
  })

  it('isReady resolves even if the config fetch fails', async () => {
    const store = useStore({
      hasPercentiles: true,
      reject: true,
    })

    expect(store.loading).toBe(true)
    expect(store.analytics).toBe(false)
    expect(store.percentiles).toBe(false)

    await store.isReady()

    expect(store.loading).toBe(false)
    expect(store.analytics).toBe(false)
    expect(store.percentiles).toBe(false)
  })
})


