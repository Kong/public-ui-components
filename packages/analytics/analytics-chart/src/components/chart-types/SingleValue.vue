<template>
  <div
    class="chart-parent"
    data-testid="single-value-parent"
  >
    <KEmptyState
      v-if="singleValue === null"
      class="single-value-error"
      data-testid="single-value-error"
      icon-variant="error"
      :title="i18n.t('singleValue.valueError')"
    />
    <div
      v-else
      class="single-value-wrapper"
    >
      <span
        class="single-value"
        data-testid="single-value-chart"
      >
        {{ formattedValue }}
      </span>
      <span
        v-if="displayMetricUnit"
        class="single-value-unit"
      >
        &nbsp;{{ metricUnit }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { PropType } from 'vue'
import type { AnalyticsExploreRecord, ExploreResultV4, AllAggregations } from '@kong-ui-public/analytics-utilities'
import { SINGLE_VALUE_DEFAULT_DECIMAL_POINTS } from '../../constants'
import composables from '../../composables'
import { useFormatUnit } from '@kong-ui-public/analytics-utilities'

const { i18n } = composables.useI18n()
const { formatBytes } = useFormatUnit({ i18n })

const props = defineProps({
  data: {
    type: Object as PropType<ExploreResultV4>,
    required: true,
  },
  /**
   * Number of decimal points to display
   */
  decimalPoints: {
    type: Number,
    default: SINGLE_VALUE_DEFAULT_DECIMAL_POINTS,
  },
})

const record = computed((): AnalyticsExploreRecord => props.data.data[0])
const metricName = computed((): AllAggregations | undefined => props.data.meta?.metric_names?.[0])
const metricUnit = computed((): string | undefined => {
  const unit = metricName.value ? props.data.meta?.metric_units?.[metricName.value] : undefined
  if (unit) {
    return i18n.t(`chartUnits.${unit as 'count/minute' | 'ms'}`, { plural: '' })
  }

  return undefined
})
// by default, display metric units for requests per minute, latency
const displayMetricUnit = computed((): boolean => metricName.value === 'request_per_minute' || !!metricName.value?.includes('_latency_'))

const singleValue = computed((): number | null => {
  if (!record.value || !metricName.value || typeof record.value.event[metricName.value] !== 'number') {
    return null
  }

  return record.value.event[metricName.value] as number
})

const formattedValue = computed((): string => {
  const value = singleValue.value

  if (value === null) {
    return ''
  }

  // for response/request size metrics, display in bytes
  if (metricName.value?.includes('_size_')) {
    return formatBytes(value)
  }

  // if number is greater than 1B, display in billions
  if (value >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1)
    return formatted.endsWith('.0') ? `${Math.floor(value / 1_000_000_000)}B` : `${formatted}B`
  }

  // if number is greater than 10M, display in millions
  if (value >= 10_000_000) {
    const formatted = (value / 1_000_000).toFixed(1)
    return formatted.endsWith('.0') ? `${Math.floor(value / 1_000_000)}M` : `${formatted}M`
  }

  const decimalPoints = props.decimalPoints && typeof props.decimalPoints === 'number' ? props.decimalPoints : SINGLE_VALUE_DEFAULT_DECIMAL_POINTS
  return value.toLocaleString('en-US', { maximumFractionDigits: decimalPoints })
})

onMounted(() => {
  if (props.data?.data?.length > 1) {
    console.warn('SingleValue chart should only be used with a single data point. Data length:', props.data.data.length)
  }
})
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;
@use "../../styles/chart";

.chart-parent {
  container-type: inline-size;

  .single-value-error {
    &:deep(.empty-state-title) {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      margin: var(--kui-space-0, $kui-space-0);
    }
  }

  .single-value-wrapper {
    align-items: baseline;
    display: inline-flex;

    .single-value {
      color: $kui-color-text;
      font-size: $kui-font-size-70;
      font-weight: $kui-font-weight-bold;
      line-height: $kui-line-height-70;
    }

    .single-value-unit {
      color: $kui-color-text;
      font-size: $kui-font-size-60;
      font-weight: $kui-font-weight-bold;
      line-height: $kui-line-height-60;
    }

    @container (min-width: 300px) {
      .single-value {
        font-size: $kui-font-size-100;
        line-height: $kui-line-height-100;
      }

      .single-value-unit {
        font-size: $kui-font-size-90;
        line-height: $kui-line-height-90;
      }
    }

    @container (min-width: 500px) {
      .single-value {
        font-size: 56px;
        line-height: 64px;
      }

      .single-value-unit {
        font-size: $kui-font-size-100;
        line-height: $kui-line-height-100;
      }
    }

    @container (min-width: 700px) {
      .single-value {
        font-size: 64px;
        line-height: 72px;
      }

      .single-value-unit {
        font-size: 56px;
        line-height: 64px;
      }
    }

    @container (min-width: 1000px) {
      .single-value {
        font-size: 80px;
        line-height: 88px;
      }

      .single-value-unit {
        font-size: 64px;
        line-height: 72px;
      }
    }

    @container (min-width: 1200px) {
      .single-value {
        font-size: 96px;
        line-height: 104px;
      }

      .single-value-unit {
        font-size: 80px;
        line-height: 88px;
      }
    }
  }
}
</style>
