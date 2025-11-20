<template>
  <BaseAnalyticsEcharts
    :enable-brush="timeseriesZoom"
    :enable-zoom="timeseriesZoom"
    :granularity="timeSeriesGranularity"
    :option="option"
    :render-mode="renderMode"
    :theme="theme"
    :tooltip-state="tooltipState"
    :zoom-action-items="zoomActionItems"
    @select-chart-range="emit('select-chart-range', $event)"
    @zoom-time-range="emit('zoom-time-range', $event)"
  />
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { msToGranularity, type AbsoluteTimeRangeV4, type ExploreAggregations, type ExploreResultV4, type GranularityValues } from '@kong-ui-public/analytics-utilities'
import composables from '../composables'
import type { TooltipState } from './ChartTooltip.vue'
import BaseAnalyticsEcharts from './BaseAnalyticsEcharts.vue'
import type { ZoomActionItem } from './ZoomActions.vue'
import type { Threshold, ExternalLink } from '../types'

const {
  data,
  type,
  stacked = false,
  timeseriesZoom = false,
  requestsLink = undefined,
  exploreLink = undefined,
  threshold = undefined,
  theme = 'light',
  renderMode = 'svg',
} = defineProps<{
  data: ExploreResultV4
  type: 'timeseries_line' | 'timeseries_bar'
  stacked?: boolean
  timeseriesZoom?: boolean
  requestsLink?: ExternalLink
  exploreLink?: ExternalLink
  threshold?: Partial<Record<ExploreAggregations, Threshold[]>>
  theme?: 'light' | 'dark'
  renderMode?: 'svg' | 'canvas'
}>()

const emit = defineEmits<{
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
  (e: 'select-chart-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const tooltipState = ref<TooltipState>({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const { i18n } = composables.useI18n()
const { option } = composables.useExploreResultToEchartTimeseries({
  exploreResult: toRef(() => data),
  chartType: toRef(() => type),
  stacked: toRef(() => stacked),
  threshold: toRef(() => threshold),
  tooltipState,
})

const timeSeriesGranularity = computed<GranularityValues>(() => {
  if (!data.meta.granularity_ms) {
    return msToGranularity(
      new Date(data.data[1].timestamp).getTime() - new Date(data.data[0].timestamp).getTime(),
    ) || 'hourly'
  }
  return msToGranularity(data.meta.granularity_ms) || 'hourly'
})

const zoomActionItems = computed<ZoomActionItem[]>(() => {
  return [
    ...(timeseriesZoom ? [{
      label: i18n.t('zoom_action_items.zoom'),
      key: 'zoom-in',
      action: (newTimeRange: AbsoluteTimeRangeV4) => emit('zoom-time-range', newTimeRange),
    }] : []),
    ...(exploreLink ? [{
      label: i18n.t('zoom_action_items.explore'),
      key: 'explore',
      href: exploreLink.href,
    }] : []),
    ...(requestsLink ? [{
      label: i18n.t('zoom_action_items.view_requests'),
      key: 'view-requests',
      href: requestsLink.href,
    }] : []),
  ]
})
</script>
