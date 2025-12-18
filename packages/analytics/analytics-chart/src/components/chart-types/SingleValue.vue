<template>
  <div
    class="chart-parent"
    :class="alignmentClass"
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
      <div
        v-if="showTrend"
        class="single-value-trend"
      >
        <div
          class="trend-change"
          :class="textColor(polarity)"
          data-testid="single-value-trend"
        >
          <component
            :is="trendIcon"
            v-if="polarity !== 0"
            :color="colorAttribute(polarity)"
            :size="KUI_ICON_SIZE_30"
          />
          <EqualIcon
            v-else
            :color="`var(--kui-color-text-neutral-strong, ${KUI_COLOR_TEXT_NEUTRAL_STRONG})`"
            :size="KUI_ICON_SIZE_30"
          />
          <div>{{ formattedChange }}</div>
        </div>
        <div
          v-if="trendRange"
          class="single-value-trend-range"
          data-testid="single-value-trend-range"
        >
          {{ trendRange }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { AnalyticsExploreRecord, ExploreResultV4, AllAggregations } from '@kong-ui-public/analytics-utilities'

import { computed, onMounted } from 'vue'
import { unitFormatter } from '@kong-ui-public/analytics-utilities'
import { changePolarity, metricChange, defineIcon, calculateChange, useTrendRange } from '@kong-ui-public/analytics-metric-provider'
import { EqualIcon } from '@kong/icons'
import {
  KUI_COLOR_TEXT_DANGER_STRONG,
  KUI_COLOR_TEXT_SUCCESS,
  KUI_COLOR_TEXT_NEUTRAL_STRONG,
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'

import { SINGLE_VALUE_DEFAULT_DECIMAL_POINTS } from '../../constants'
import composables from '../../composables'

const { i18n } = composables.useI18n()
const { formatBytes } = unitFormatter({ i18n })

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
  leftAlign: {
    type: Boolean,
    default: false,
  },
  showTrend: {
    type: Boolean,
    default: false,
  },
  increaseIsBad: {
    type: Boolean,
    default: false,
  },
  alignX: {
    type: String as PropType<'left' | 'center' | 'right' | 'between' | 'around' | 'evenly'>,
    default: 'space-evenly',
  },
})

const alignmentClass = computed(() => `align-${props.leftAlign ? 'left' : props.alignX}`)

const records = computed<AnalyticsExploreRecord[]>(() => props.data.data)
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

const previousValue = computed<number | null>(() => {
  if (!props.showTrend || records.value.length < 2 || !metricName.value) {
    return null
  }

  const value = records.value[0].event[metricName.value]

  if (typeof value !== 'number' || isNaN(value)) {
    return null
  }

  return value
})

const singleValue = computed<number | null>(() => {
  if (!metricName.value) {
    return null
  }

  // With trend: need 2 records (previous at [0], current at [1])
  // Without trend: need 1 record (current at [0])
  const requiredRecords = props.showTrend ? 2 : 1
  const currentIndex = props.showTrend ? 1 : 0

  if (records.value.length < requiredRecords) {
    return null
  }

  const value = records.value[currentIndex].event[metricName.value]

  // Check if value is actually a number
  if (typeof value !== 'number' || isNaN(value)) {
    return null
  }

  return value
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

const change = computed(() => calculateChange(singleValue.value ?? 0, previousValue.value ?? 0) || 0)
const polarity = computed(() => changePolarity(change.value, true, props.increaseIsBad)) // Assume hasTrendAccess=true
const trendIcon = computed(() => defineIcon(polarity.value))
const formattedChange = computed(() => metricChange(change.value, true, i18n.t('singleValue.trend.not_available')))
const trendRange = useTrendRange(computed(() => props.showTrend), undefined, computed(() => props.data.meta))

const textColor = (polarityNum: number) => {
  if (polarityNum > 0) {
    return 'positive'
  }

  if (polarityNum < 0) {
    return 'negative'
  }

  return 'neutral'
}

// same for color token mapping
const colorAttribute = (polarityNum: number) => {
  if (polarityNum > 0) {
    return KUI_COLOR_TEXT_SUCCESS
  }

  if (polarityNum < 0) {
    return KUI_COLOR_TEXT_DANGER_STRONG
  }

  return KUI_COLOR_TEXT_NEUTRAL_STRONG
}

onMounted(() => {
  if (!props.showTrend && props.data?.data?.length > 1) {
    console.warn('SingleValue chart should only be used with a single data point. Data length:', props.data.data.length)
  } else if (props.showTrend && props.data?.data?.length !== 2) {
    console.warn('SingleValue with trend expects exactly 2 data points. Data length:', props.data.data.length)
  }
})
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;
@use "../../styles/chart";

.chart-parent {
  container-type: inline-size;

  &.align-left {
    justify-content: flex-start;
  }

  &.align-center {
    justify-content: center;
  }

  &.align-right {
    justify-content: flex-end;
  }

  &.align-between {
    justify-content: space-between;
  }

  &.align-around {
    justify-content: space-around;
  }

  &.align-evenly {
    justify-content: space-evenly;
  }

  .single-value-error {
    &:deep(.empty-state-title) {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      margin: var(--kui-space-0, $kui-space-0);
    }
  }

  .single-value-wrapper {
    align-items: baseline;
    display: flex;
    flex-direction: column;
    gap: 12px;

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

    .single-value-trend {
      align-items: center;
      column-gap: var(--kui-space-40, $kui-space-40);
      display: flex;

      .trend-change {
        align-items: center;
        border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
        display: flex;
        flex-direction: row;
        font-size: var(--kui-font-size-20, $kui-font-size-20);
        font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
        padding: var(--kui-space-20, $kui-space-20)
          var(--kui-space-40, $kui-space-40);

        .kui-icon {
          margin-right: var(--kui-space-20, $kui-space-20);
        }

        &.positive {
          background-color: var(--kui-color-background-success-weakest, $kui-color-background-success-weakest);
          color: var(--kui-color-text-success, $kui-color-text-success);
        }

        &.negative {
          background-color: var(--kui-color-background-danger-weakest, $kui-color-background-danger-weakest);
          color: var(--kui-color-text-danger-strong, $kui-color-text-danger-strong);
        }

        &.neutral {
          background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
          color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
        }
      }

      .single-value-trend-range {
        color: var(--kui-color-text, $kui-color-text);
        font-size: var(--kui-font-size-20, $kui-font-size-20);
      }
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
