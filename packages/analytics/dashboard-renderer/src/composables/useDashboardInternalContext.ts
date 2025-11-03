import { computed, getCurrentInstance, ref, type Ref, type DeepReadonly } from 'vue'
import type { DashboardRendererContext, DashboardRendererContextInternal } from '../types'
import type {
  AllFilters,
  DashboardConfig,
  TimeRangeV4,
} from '@kong-ui-public/analytics-utilities'
import {
  DEFAULT_TILE_REFRESH_INTERVAL_MS,
  FULLSCREEN_LONG_REFRESH_INTERVAL_MS,
  FULLSCREEN_SHORT_REFRESH_INTERVAL_MS,
} from '../constants'
import { useAnalyticsConfigStore } from '@kong-ui-public/analytics-config-store'

export default function useDashboardInternalContext({
  config,
  context,
  isFullscreen = ref(false),
}: {
  config: Readonly<Ref<DeepReadonly<DashboardConfig>>>
  context: Readonly<Ref<DeepReadonly<DashboardRendererContext>>>
  isFullscreen?: Readonly<Ref<boolean>>
}): {
    internalContext: Readonly<Ref<DashboardRendererContextInternal>>
  } {
  const configStore = useAnalyticsConfigStore()

  const timeSpec = computed<TimeRangeV4>(() => {
    if (context.value.timeSpec) {
      return context.value.timeSpec
    }

    return {
      type: 'relative',
      time_range: configStore.defaultQueryTimeForOrg,
    }
  })

  const internalContext = computed<DashboardRendererContextInternal>(() => {
    let { tz, refreshInterval, editable } = context.value
    const filters = [...(context.value.filters ?? []), ...(config.value.preset_filters ?? [])] as AllFilters[]

    if (!tz) {
      tz = (new Intl.DateTimeFormat()).resolvedOptions().timeZone
    }

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
      const isPast = timeSpec.value.type === 'absolute'
        && timeSpec.value.end.getTime() < now

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

    if (editable === undefined) {
      editable = false
    }

    // Check if the host app has provided an event handler for zooming.
    // If there's no handler, disable zooming -- it won't do anything.
    const zoomable = !!getCurrentInstance()?.vnode?.props?.onTileTimeRangeZoom

    return {
      filters,
      tz,
      timeSpec: timeSpec.value,
      refreshInterval,
      editable,
      zoomable,
    }
  })

  return {
    internalContext,
  }
}
