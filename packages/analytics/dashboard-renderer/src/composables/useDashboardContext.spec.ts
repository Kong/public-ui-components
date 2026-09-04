import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import { useRoute } from 'vue-router'
import useDashboardContext from './useDashboardContext'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import type { DashboardRendererContext, ZoomConfiguration } from '../types'
import type {
  AllFilters,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import {
  INJECT_QUERY_PROVIDER,
  DEFAULT_TILE_REFRESH_INTERVAL_MS,
  FULLSCREEN_LONG_REFRESH_INTERVAL_MS,
  FULLSCREEN_SHORT_REFRESH_INTERVAL_MS,
} from '../constants'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'

vi.mock('vue', async (importActual) => {
  const actual = await importActual()
  return {
    // @ts-ignore this is how we mock this
    ...actual,
    default: actual,
    getCurrentInstance: vi.fn(),
  }
})

vi.mock('vue-router', () => {
  return {
    useRoute: vi.fn(),
  }
})

// need to import after the mock
import { getCurrentInstance, nextTick, ref, type App, type Ref } from 'vue'

describe('useDashboardContext', () => {
  let app: App | undefined
  let configFn: Mock
  let datasourceConfigFn: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    configFn = vi.fn(() => Promise.resolve({}))
    datasourceConfigFn = vi.fn(() => Promise.resolve([]))
    app = setupPiniaTestStore({ createVueApp: true })
    if (app) {
      app.provide(INJECT_QUERY_PROVIDER, { configFn, datasourceConfigFn })
    }
  })

  const setup = async ({
    contextEditable,
    /**
     * filters must be present in the context, all other keys are optional
     */
    contextFilters = [],
    contextRefreshInterval,
    contextTimeSpec,
    contextTz,
    globalFilters = [],
    hasZoomProp = false,
    isExploreUrl = false,
    isFullscreen = false,
    isLoading = false,
    preview = false,
  }: {
    contextEditable?: boolean
    contextFilters?: AllFilters[]
    contextRefreshInterval?: number
    contextTimeSpec?: TimeRangeV4
    contextTz?: string
    globalFilters?: AllFilters[]
    hasZoomProp?: boolean
    isExploreUrl?: boolean
    isFullscreen?: boolean
    isLoading?: boolean
    preview?: boolean
  } = {}) => {
    const context = ref<DashboardRendererContext>({
      filters: contextFilters,
      ...(contextTimeSpec !== undefined && { timeSpec: contextTimeSpec }),
      ...(contextTz !== undefined && { tz: contextTz }),
      ...(contextRefreshInterval !== undefined && { refreshInterval: contextRefreshInterval }),
      ...(contextEditable !== undefined && { editable: contextEditable }),
    })

    ;(getCurrentInstance as Mock).mockImplementation(() => {
      return {
        vnode: {
          props: {
            onTileTimeRangeZoom: hasZoomProp ? vi.fn() : undefined,
          },
        },
      }
    })

    ;(useRoute as Mock).mockReturnValue({
      path: isExploreUrl ? '/us/analytics/explorer' : '/us/analytics',
    })

    configFn.mockImplementation(() => {
      if (isLoading) {
        return new Promise(() => {})
      }

      return Promise.resolve({})
    })
    datasourceConfigFn.mockImplementation(() =>
      isLoading ? new Promise(() => {}) : Promise.resolve([]),
    )

    let enrichedContext: Ref<DashboardRendererContext>
    let queryReady: Ref<boolean>
    let zoomConfiguration: Ref<ZoomConfiguration>
    const wrapper = mount({
      template: '<div />',
      setup() {
        const result = useDashboardContext({
          context,
          globalFilters: ref(globalFilters),
          isFullscreen: ref(isFullscreen),
          preview: ref(preview),
        })
        enrichedContext = result.enrichedContext
        queryReady = result.queryReady
        zoomConfiguration = result.zoomConfiguration
      },
    })

    await nextTick()

    return {
      wrapper,
      // @ts-ignore it's defined in mount, and we await nextTick for it
      enrichedContext,
      // @ts-ignore it's defined in mount, and we await nextTick for it
      queryReady,
      // @ts-ignore it's defined in mount, and we await nextTick for it
      zoomConfiguration,
    }
  }

  it('has sane defaults when the minimum is provided', async () => {
    const { enrichedContext } = await setup({ contextFilters: [] })

    const configStore = useAnalyticsConfigStore()
    const defaultTimeSpec = {
      type: 'relative',
      time_range: configStore.defaultQueryTimeForOrg,
    }

    expect(enrichedContext.value).to.deep.eq({
      editable: false,
      filters: [],
      refreshInterval: DEFAULT_TILE_REFRESH_INTERVAL_MS,
      showTileActions: true,
      timeSpec: defaultTimeSpec,
      tz: (new Intl.DateTimeFormat()).resolvedOptions().timeZone,
    })
  })

  it('uses the context timeSpec when provided', async () => {
    const timeSpec: TimeRangeV4 = { type: 'relative', time_range: '1h' }
    const { enrichedContext, queryReady } = await setup({ contextTimeSpec: timeSpec })
    expect(enrichedContext.value).toEqual(expect.objectContaining({ timeSpec }))
    expect(queryReady.value).to.eq(true)
  })

  it('sets queryReady to false when the config store is still loading and no timeSpec was provided', async () => {
    const { queryReady } = await setup({ contextFilters: [], isLoading: true })

    expect(queryReady.value).to.eq(false)
  })

  it('uses the context tz when provided', async () => {
    const tz:string = 'UTC'
    const { enrichedContext } = await setup({ contextTz: tz })
    expect(enrichedContext.value).toEqual(expect.objectContaining({ tz }))
  })

  it('uses the context editable when provided', async () => {
    const editable = true
    const { enrichedContext } = await setup({ contextEditable: editable })
    expect(enrichedContext.value).toEqual(expect.objectContaining({ editable }))
  })

  it.each([
    [0], [100], [42], [30000],
  ])('uses the context refreshInterval \'%s\' when provided', async (refreshInterval: number) => {
    const { enrichedContext } = await setup({ contextRefreshInterval: refreshInterval })
    expect(enrichedContext.value).toEqual(expect.objectContaining({ refreshInterval }))
  })

  it.each([
    [0, 'is a relative value in the past', {
      type: 'relative',
      time_range: 'previous_week',
    } as TimeRangeV4],
    [0, 'is an absolute value in the past', {
      type: 'absolute',
      start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      end: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    } as TimeRangeV4],
    [FULLSCREEN_SHORT_REFRESH_INTERVAL_MS, 'is relative value <= 24hrs', {
      type: 'relative',
      time_range: '24h',
    } as TimeRangeV4],
    [FULLSCREEN_SHORT_REFRESH_INTERVAL_MS, 'is absolute value <= 24hrs', {
      type: 'absolute',
      start: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hrs ago
      end: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes in the future
    } as TimeRangeV4],
    [FULLSCREEN_LONG_REFRESH_INTERVAL_MS, 'is relative value > 24hrs', {
      type: 'relative',
      time_range: '7d',
    } as TimeRangeV4],
    [FULLSCREEN_LONG_REFRESH_INTERVAL_MS, 'is absolute value > 24hrs', {
      type: 'absolute',
      start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 4 days ago
      end: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes in the future
    } as TimeRangeV4],
  ])('sets the refreshInterval to %s when isFullscreen and timeSpec %s', async (expectedInterval, title, contextTimeSpec) => {
    const { enrichedContext } = await setup({ isFullscreen: true, contextTimeSpec })
    expect(enrichedContext.value.refreshInterval).toEqual(expectedInterval)
  })

  it.each([
    ['when just context filters are empty', true, false],
    ['when just global filters are empty', false, true],
    ['when both filters are empty', true, true],
    ['when neither filters are empty', false, false],
  ])('merges the context filters with global filters: %s', async (title, isContextEmpty, isGlobalEmpty) => {
    const contextFilters: AllFilters[] = isContextEmpty
      ? []
      : [{
        field: 'api', operator: 'in', value: ['test_api'],
      }, {
        field: 'route', operator: 'in', value: ['test_route'],
      }]

    const globalFilters: AllFilters[] = isGlobalEmpty
      ? []
      : [{
        field: 'control_plane', operator: 'in', value: ['test_control_plane'],
      }, {
        field: 'status_code', operator: 'in', value: ['test_status_code'],
      }]

    const { enrichedContext } = await setup({ contextFilters, globalFilters })
    expect(enrichedContext.value).toEqual(expect.objectContaining({
      filters: [...contextFilters, ...globalFilters],
    }))
  })

  it('forces editable to false when preview is true, even if context.editable is true', async () => {
    const { enrichedContext } = await setup({ contextEditable: true, preview: true })
    expect(enrichedContext.value.editable).to.eq(false)
  })

  describe('zoomConfiguration', () => {
    it.each([
      [true, false, true],
      [false, false, false],
      [false, true, true],
      [false, true, false],
    ])('sets enabled and showZoomInAction to %s when preview is %s and the node onTileTimeRangeZoom prop set %s', async (
      expected,
      preview,
      hasZoomProp,
    ) => {
      const { zoomConfiguration } = await setup({ hasZoomProp, preview })
      expect(zoomConfiguration.value.enabled).to.eq(expected)
      expect(zoomConfiguration.value.showZoomInAction).to.eq(expected)
    })

    it.each([
      [true, false, false],
      [false, false, true],
      [false, true, false],
      [false, true, true],
    ])('sets showExploreAction to %s when preview is %s isExploreUrl is %s', async (
      expected,
      preview,
      isExploreUrl,
    ) => {
      const { zoomConfiguration } = await setup({ isExploreUrl, preview })
      expect(zoomConfiguration.value.showExploreAction).to.eq(expected)
    })

    it.each([
      [true, false],
      [false, true],
    ])('sets showRequestsAction to %s when preview is %s', async (
      expected,
      preview,
    ) => {
      const { zoomConfiguration } = await setup({ preview })
      expect(zoomConfiguration.value.showRequestsAction).to.eq(expected)
    })
  })
})
