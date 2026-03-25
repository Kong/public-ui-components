import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { App } from 'vue'
import { nextTick } from 'vue'
import type { AllFilters, DatasourceConfig } from '@kong-ui-public/analytics-utilities'
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

  it('isReady resolves even if the config fetch fails', async () => {
    const store = useStore({ reject: true })

    await store.isReady()
    expect(store.loading).toBe(false)
    expect(store.datasourceConfig).toEqual([])
  })

  describe('isFilterValidForDatasource', () => {
    it('returns true for a valid filter', async () => {
      const store = useStore()
      await store.isReady()

      const filter = {
        field: 'status_code',
        operator: 'in',
        value: ['200'],
      } as AllFilters

      expect(store.isFilterValidForDatasource({ datasource: 'api_usage', filter })).toBe(true)
    })

    it('returns false when the field is not in the datasource', async () => {
      const store = useStore()
      await store.isReady()

      const filter = {
        field: 'route',
        operator: 'in',
        value: ['route-id'],
      } as AllFilters

      expect(store.isFilterValidForDatasource({ datasource: 'api_usage', filter })).toBe(false)
    })

    it('returns false when the field has no filter config', async () => {
      const store = useStore()
      await store.isReady()

      const filter = {
        field: 'request_count',
        operator: 'in',
        value: ['200'],
      } as AllFilters

      expect(store.isFilterValidForDatasource({ datasource: 'api_usage', filter })).toBe(false)
    })

    it('returns false when the operator is not supported', async () => {
      const store = useStore()
      await store.isReady()

      const filter = {
        field: 'status_code',
        operator: '=',
        value: ['200'],
      } as AllFilters

      expect(store.isFilterValidForDatasource({ datasource: 'api_usage', filter })).toBe(false)
    })

    it('returns true for unknown datasources', async () => {
      const store = useStore()
      await store.isReady()

      const filter = {
        field: 'unknown_field',
        operator: 'in',
        value: ['value'],
      } as AllFilters

      expect(store.isFilterValidForDatasource({ datasource: 'goap_test', filter })).toBe(true)
    })
  })

  describe('stripUnknownFilters', () => {
    it('removes invalid filters and keeps valid ones', async () => {
      const store = useStore()
      await store.isReady()

      const validFilter = {
        field: 'status_code',
        operator: 'in',
        value: ['200'],
      } as AllFilters

      const invalidFilter = {
        field: 'request_count',
        operator: 'in',
        value: ['200'],
      } as AllFilters

      const result = store.stripUnknownFilters({
        datasource: 'api_usage',
        filters: [invalidFilter, validFilter],
      })

      expect(result).toEqual([validFilter])
    })

    it('keeps all filters for unknown datasources', async () => {
      const store = useStore()
      await store.isReady()

      const filters = [
        {
          field: 'status_code',
          operator: 'in',
          value: ['200'],
        },
        {
          field: 'unknown_field',
          operator: 'in',
          value: ['value'],
        },
      ] as AllFilters[]

      expect(store.stripUnknownFilters({ datasource: 'goap_test', filters })).toEqual(filters)
    })
  })
})
