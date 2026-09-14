import { computed, getCurrentInstance, ref, type Ref, type DeepReadonly } from 'vue'
import type { DashboardRendererContext } from '../types'
import type {
  AllFilters,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import { storeToRefs } from 'pinia'
import {
  DEFAULT_TILE_REFRESH_INTERVAL_MS,
  FULLSCREEN_LONG_REFRESH_INTERVAL_MS,
  FULLSCREEN_SHORT_REFRESH_INTERVAL_MS,
} from '../constants'
import { useAnalyticsConfigStore, useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'

export default function useDashboardContext({
  context,
  globalFilters = ref([]),
  isFullscreen = ref(false),
  preview = ref(false),
}: {
  context: Readonly<Ref<DeepReadonly<DashboardRendererContext>>>
  globalFilters?: Readonly<Ref<DeepReadonly<AllFilters[]>>>
  isFullscreen?: Readonly<Ref<boolean>>
  preview?: Readonly<Ref<boolean>>
}): {
  editable: Readonly<Ref<boolean>>
  enrichedContext: Readonly<Ref<DashboardRendererContext>>
  filters: Readonly<Ref<AllFilters[]>>
  queryReady: Readonly<Ref<boolean>>
  refreshInterval: Readonly<Ref<number>>
  showTileActions: Readonly<Ref<boolean>>
  showTileZoomActions: Readonly<Ref<boolean>>
  timeSpec: Readonly<Ref<TimeRangeV4>>
  tz: Readonly<Ref<string>>
  zoomable: Readonly<Ref<boolean>>
} {
  const configStore = useAnalyticsConfigStore()
  const datasourceStore = useDatasourceConfigStore()
  const { loading: configLoading } = storeToRefs(configStore)
  const { loading: datasourceLoading } = storeToRefs(datasourceStore)

  const timeSpec = computed<TimeRangeV4>(() => {
    if (context.value.timeSpec) {
      return context.value.timeSpec
    }

    return {
      type: 'relative',
      time_range: configStore.defaultQueryTimeForOrg,
    }
  })

  const tz = computed<string>(() => {
    // Get the timezone property from the context if it exists, otherwise use the browser's current timezone.
    const { tz } = context.value

    if (!tz) {
      return (new Intl.DateTimeFormat()).resolvedOptions().timeZone
    }

    return tz
  })

  const editable = computed<boolean>(() => {
    // We're not editable if the context.editable is undefined, or if we're currently previewing.
    const { editable } = context.value

    if (editable === undefined || preview.value) {
      return false
    }

    return editable
  })

  const showTileActions = computed<boolean>(() => {
    const { showTileActions } = context.value

    if (preview.value) {
      return false
    }

    if (showTileActions === undefined) {
      return true
    }

    return showTileActions
  })

  const zoomable = computed<boolean>(() => {
    // Check if the host app has provided an event handler for zooming.
    // If there's no handler, disable zooming -- it won't do anything.
    // Preview mode also disables zooming.
    return !preview.value && !!getCurrentInstance()?.vnode?.props?.onTileTimeRangeZoom
  })

  const filters = computed<AllFilters[]>(() => {
    return [...(context.value.filters ?? []), ...(globalFilters.value)] as AllFilters[]
  })

  const refreshInterval = computed<number>(() => {
    let { refreshInterval } = context.value

    // Check explicitly against undefined because 0 is a valid refresh interval.
    if (refreshInterval === undefined) {
      refreshInterval = DEFAULT_TILE_REFRESH_INTERVAL_MS
    }

    if (isFullscreen.value) {
      // when we're fullscreen, we want to refresh automatically, regardless of
      // what the configured refreshInterval is.
      let isShort = false
      if (timeSpec.value.type === 'relative') {
        isShort = ['15m', '1h', '6h', '12h', '24h'].includes(timeSpec.value.time_range)
      } else {
        const start = timeSpec.value.start.getTime()
        const end = timeSpec.value.end.getTime()
        const diffMs = Math.abs(end - start)
        isShort = diffMs <= 86400000 // less than or equal to 24 hours
      }

      const now = new Date().getTime()
      const isPast = (
        timeSpec.value.type === 'absolute'
        && timeSpec.value.end.getTime() < now
      ) || (
        timeSpec.value.type === 'relative'
        && ['previous_week', 'previous_month'].includes(timeSpec.value.time_range)
      )

      if (isPast) {
        // if the timerange is in the past there's no need to refresh
        refreshInterval = 0
      } else if (isShort) {
        // if the timerange is 24 hours or less, refresh more frequently
        refreshInterval = FULLSCREEN_SHORT_REFRESH_INTERVAL_MS
      } else {
        // otherwise, refresh less frequently
        refreshInterval = FULLSCREEN_LONG_REFRESH_INTERVAL_MS
      }
    }

    return refreshInterval
  })

  const showTileZoomActions = computed<boolean>(() => {
    return !preview.value
  })

  const enrichedContext = computed<DashboardRendererContext>(() => {
    return {
      filters: filters.value,
      timeSpec: timeSpec.value,
      tz: tz.value,
      refreshInterval: refreshInterval.value,
      editable: editable.value,
      showTileActions: showTileActions.value,
      showTileZoomActions: showTileZoomActions.value,
      zoomable: zoomable.value,
    }
  })

  const queryReady = computed<boolean>(() => {
    return !configLoading.value && !datasourceLoading.value
  })

  return {
    editable,
    /**
     * the context with all values enriched with any external circumstances that
     * may modify how it works applied to it.
     */
    enrichedContext,
    filters,
    /**
     * A basic check to see if all configuration has been loaded.
     */
    queryReady,
    refreshInterval,
    showTileActions,
    showTileZoomActions,
    timeSpec,
    tz,
    zoomable,
  }
}
