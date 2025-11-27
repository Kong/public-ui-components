import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { mount } from '@vue/test-utils'
import useDashboardInternalContext from './useDashboardInternalContext'
import { setupPiniaTestStore } from '../stores/tests/setupPiniaTestStore'
import type { DashboardRendererContext, DashboardRendererContextInternal } from '../types'
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

// need to import after the mock
import { getCurrentInstance, nextTick, ref, type App, type Ref } from 'vue'


describe('useContextLinks', () => {
  let app: App | undefined
  beforeEach(() => {
    vi.clearAllMocks()
    app = setupPiniaTestStore({ createVueApp: true })
    if (app) {
      app.provide(INJECT_QUERY_PROVIDER, { configFn: vi.fn(() => Promise.resolve({})) })
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
    isFullscreen = false,
  }: {
    contextEditable?: boolean
    contextFilters?: AllFilters[]
    contextRefreshInterval?: number
    contextTimeSpec?: TimeRangeV4
    contextTz?: string
    globalFilters?: AllFilters[]
    hasZoomProp?: boolean
    isFullscreen?: boolean
  } = {}) => {
    const context = ref<DashboardRendererContext>({
      filters: contextFilters,
      ...(contextTimeSpec !== undefined && { timeSpec: contextTimeSpec }),
      ...(contextTz !== undefined && { tz: contextTz }),
      ...(contextRefreshInterval !== undefined && { refreshInterval: contextRefreshInterval }),
      ...(contextEditable !== undefined && { editable: contextEditable }),
    })

    ;(getCurrentInstance as Mock).mockImplementation(() => {
      console.log('got here')
      return {
        vnode: {
          props: {
            onTileTimeRangeZoom: hasZoomProp ? vi.fn() : undefined,
          },
        },
      }
    })

    let internalContext: Ref<DashboardRendererContextInternal>
    const wrapper = mount({
      template: '<div />',
      setup() {
        const result = useDashboardInternalContext({
          context,
          globalFilters: ref(globalFilters),
          isFullscreen: ref(isFullscreen),
        })
        internalContext = result.internalContext
      },
    })

    await nextTick()

    return {
      wrapper,
      // @ts-ignore it's defined in mount, and we await nextTick for it
      internalContext,
    }
  }

  it('has sane defaults when the minimum is provided', async () => {
    const { internalContext } = await setup({ contextFilters: [] })

    const configStore = useAnalyticsConfigStore()
    const defaultTimeSpec = {
      type: 'relative',
      time_range: configStore.defaultQueryTimeForOrg,
    }

    expect(internalContext.value).to.deep.eq({
      editable: false,
      filters: [],
      refreshInterval: DEFAULT_TILE_REFRESH_INTERVAL_MS,
      timeSpec: defaultTimeSpec,
      tz: (new Intl.DateTimeFormat()).resolvedOptions().timeZone,
      zoomable: false,
    })
  })

  it('uses the context timeSpec when provided', async () => {
    const timeSpec: TimeRangeV4 = { type: 'relative', time_range: '1h' }
    const { internalContext } = await setup({ contextTimeSpec: timeSpec })
    expect(internalContext.value).toEqual(expect.objectContaining({ timeSpec }))
  })

  it('uses the context tz when provided', async () => {
    const tz:string = 'UTC'
    const { internalContext } = await setup({ contextTz: tz })
    expect(internalContext.value).toEqual(expect.objectContaining({ tz }))
  })

  it('uses the context editable when provided', async () => {
    const editable = true
    const { internalContext } = await setup({ contextEditable: editable })
    expect(internalContext.value).toEqual(expect.objectContaining({ editable }))
  })

  it.each([
    [0], [100], [42], [30000],
  ])('uses the context refreshInterval \'%s\' when provided', async (refreshInterval: number) => {
    const { internalContext } = await setup({ contextRefreshInterval: refreshInterval })
    expect(internalContext.value).toEqual(expect.objectContaining({ refreshInterval }))
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
    const { internalContext } = await setup({ isFullscreen: true, contextTimeSpec })
    expect(internalContext.value.refreshInterval).toEqual(expectedInterval)
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

    const { internalContext } = await setup({ contextFilters, globalFilters })
    expect(internalContext.value).toEqual(expect.objectContaining({
      filters: [...contextFilters, ...globalFilters],
    }))
  })

  it('sets zoomable to true if the node has the onTileTimeRangeZoom prop', async () => {
    const { internalContext } = await setup({ hasZoomProp: true })
    expect(internalContext.value.zoomable).to.eq(true)
  })
})
