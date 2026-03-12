import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { App } from 'vue'
import { nextTick } from 'vue'
import type { DatasourceConfig } from '@kong-ui-public/analytics-utilities'
import { useDatasourceConfigStore } from '../datasource-config'
import { setupPiniaTestStore } from './setupPiniaTestStore'

describe('useDatasourceConfigStore', () => {
  let app: App | undefined
  const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

  const datasourceConfigFixture: DatasourceConfig[] = [
    {
      name: 'api_usage',
      showInUI: true,
      fields: [
        {
          name: 'status_code',
          showInUI: true,
          aggregation: false,
          group: true,
          filter: {
            valueType: 'string',
            allowNewValues: true,
            operators: [{ type: 'multi-value', ops: ['in', 'not_in'] }],
          },
        },
        {
          name: 'request_count',
          showInUI: true,
          aggregation: true,
          group: false,
          metricGroup: 'count',
        },
      ],
    },
    {
      name: 'requests',
      showInUI: true,
      fields: [
        {
          name: 'status_code',
          showInUI: true,
          aggregation: false,
          group: true,
          filter: {
            valueType: 'number',
            allowNewValues: false,
            operators: [{ type: 'single-value', ops: ['=', '!='] }],
          },
        },
        {
          name: 'route',
          showInUI: true,
          aggregation: false,
          group: true,
          filter: {
            valueType: 'scoped-uuid',
            valueSource: 'ksearch',
            ksearchName: 'route',
            operators: [{ type: 'multi-value', ops: ['in', 'not_in'] }],
          },
        },
      ],
    },
  ]

  beforeEach(() => {
    app = setupPiniaTestStore({ createVueApp: true })
  })

  const useStore = ({
    reject = false,
    withBridge = true,
  }: {
    reject?: boolean
    withBridge?: boolean
  } = {}) => {
    const datasourceConfigFn = vi.fn(() => {
      return reject
        ? Promise.reject()
        : Promise.resolve(datasourceConfigFixture)
    })

    if (app && withBridge) {
      app.provide(INJECT_QUERY_PROVIDER, { datasourceConfigFn })
    }

    return useDatasourceConfigStore()
  }

  it('loads datasource config and builds a fields map', async () => {
    const store = useStore()

    expect(store.loading).toBe(true)
    expect(store.datasourceConfig).toBeUndefined()
    expect(store.getFieldDataSources('status_code')).toEqual([])

    await nextTick()

    expect(store.loading).toBe(false)
    expect(store.datasourceConfig).toEqual(datasourceConfigFixture)
    expect(store.datasourceConfigMap.api_usage.fieldsMap.status_code.name).toBe('status_code')
    expect(store.datasourceConfigMap.requests.fieldsMap.route.filter).toMatchObject({
      valueSource: 'ksearch',
      ksearchName: 'route',
    })
  })

  it('returns all datasource names for a field', async () => {
    const store = useStore()

    await store.isReady()

    expect(store.getFieldDataSources('status_code')).toEqual(['api_usage', 'requests'])
    expect(store.getFieldDataSources('missing_field')).toEqual([])
  })

  it('missing bridge produces warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const store = useStore({ withBridge: false })

    await store.isReady()

    expect(warnSpy).toHaveBeenCalled()
    expect(
      warnSpy.mock.calls.some(([message]) =>
        String(message).includes('Analytics components require a query bridge supplied via provide / inject.'),
      ),
    ).toBe(true)

    warnSpy.mockRestore()
    expect(store.loading).toBe(false)
    expect(store.datasourceConfig).toEqual([])
    expect(store.getFieldDataSources('status_code')).toEqual([])
  })

  it('can await the isReady function for datasource config to be loaded', async () => {
    const store = useStore()

    expect(store.loading).toBe(true)
    expect(store.datasourceConfig).toBeUndefined()

    await store.isReady()

    expect(store.loading).toBe(false)
    expect(store.datasourceConfig).toEqual(datasourceConfigFixture)
  })

  it('isReady resolves immediately if config is already loaded', async () => {
    const store = useStore()

    await store.isReady() // wait for initial load

    const start = Date.now()
    await store.isReady() // should resolve immediately
    const duration = Date.now() - start

    expect(duration).toBeLessThan(50) // arbitrary threshold to confirm it was effectively immediate
  })

  it('isReady resolves even if the config fetch fails', async () => {
    const store = useStore({ reject: true })

    await store.isReady()
    expect(store.loading).toBe(false)
    expect(store.datasourceConfig).toEqual([])
  })
})
