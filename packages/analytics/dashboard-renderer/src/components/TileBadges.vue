<template>
  <div
    class="tile-badges"
  >
    <KBadge
      v-if="limitBadge"
      data-testid="limit-badge"
    >
      {{ limitBadge }}
    </KBadge>

    <KBadge
      v-if="timeBadge"
      data-testid="time-range-badge"
      :tooltip="isAgedOutQuery ? agedOutWarning : undefined"
      :tooltip-attributes="{ maxWidth: '320px' }"
    >
      <template
        v-if="isAgedOutQuery"
        #icon
      >
        <WarningIcon :size="KUI_ICON_SIZE_20" />
      </template>
      <span class="badge-text">
        {{ timeBadge }}
      </span>
    </KBadge>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QueryResponseMeta, TileDefinition } from '@kong-ui-public/analytics-utilities'
import { formatTime, msToGranularity, TimePeriods, TIMEFRAME_LOOKUP } from '@kong-ui-public/analytics-utilities'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import composables from '../composables'

const { i18n } = composables.useI18n()

const {
  chartMeta = undefined,
  definition,
  loading = false,
} = defineProps<{
  chartMeta?: QueryResponseMeta
  definition: TileDefinition
  loading: boolean
}>()

const queryGranularity = computed(() => {
  return definition.query?.granularity ?? 'unknown'
})

const metaGranularity = computed(() => {
  return msToGranularity(chartMeta?.granularity_ms ?? 0) ?? 'unknown'
})

const isAgedOutQuery = computed(() => {
  const isTimeSeriesChart = ['timeseries_line', 'timeseries_bar'].includes(definition.chart.type)
  if (!isTimeSeriesChart || loading) {
    return false
  }

  if (queryGranularity.value === 'unknown' || metaGranularity.value === 'unknown') {
    return false
  }

  return queryGranularity.value !== metaGranularity.value
})

const agedOutWarning = computed(() => {
  return i18n.t('query_aged_out_warning', {
    currentGranularity: i18n.t(`granularities.${metaGranularity.value}` as any),
    savedGranularity: i18n.t(`granularities.${queryGranularity.value}` as any),
  })
})

const timeBadge = computed<string | null>(() => {
  const timeRange = definition.query?.time_range

  if (timeRange?.type === 'relative') {
    const timeframe = TimePeriods.get(TIMEFRAME_LOOKUP[timeRange.time_range])
    if (timeframe) {
      return timeframe.display
    }

    console.warn('Did not recognize the given relative time range:', timeRange.time_range)
    return timeRange.time_range
  } else if (timeRange?.type === 'absolute') {
    // Fall back to UTC if `tz` isn't explicitly specified because this gives the best results for dates without times.
    // When we support fine-grained absolute time, this assumption may need to be adjusted.
    const tz = timeRange.tz || 'Etc/UTC'
    return `${formatTime(timeRange.start, { short: true, tz })} - ${formatTime(timeRange.end, { short: true, tz })}`
  }

  return null
})

const limitBadge = computed<string | null>(() => {
  return definition.query?.limit !== undefined && definition.query.limit > 0
    ? `Top ${definition.query.limit}`
    : null
})
</script>

<style lang="scss" scoped>
.tile-badges {
  align-items: center;
  display: flex;
  gap: $kui-space-20;
}
</style>
