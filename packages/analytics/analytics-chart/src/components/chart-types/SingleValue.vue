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
      :title="t('singleValue.valueError')"
    />
    <span
      v-else
      class="single-value"
      data-testid="single-value-chart"
    >
      {{ formattedValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { AnalyticsExploreRecord, ExploreResultV4, AllAggregations } from '@kong-ui-public/analytics-utilities'
import { SINGLE_VALUE_DEFAULT_DECIMAL_POINTS } from '../../constants'
import composables from '../../composables'

const { i18n: { t } } = composables.useI18n()

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

  // if number is greater than 10M, display in millions
  if (value >= 10_000_000) {
    const formatted = (value / 1_000_000).toFixed(1)
    return formatted.endsWith('.0') ? `${Math.floor(value / 1_000_000)}M` : `${formatted}M`
  }

  const decimalPoints = props.decimalPoints && typeof props.decimalPoints === 'number' ? props.decimalPoints : SINGLE_VALUE_DEFAULT_DECIMAL_POINTS
  return value.toLocaleString('en-US', { maximumFractionDigits: decimalPoints })
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

  .single-value {
    color: $kui-color-text;
    font-size: $kui-font-size-50;
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-50;
  }

  @container (min-width: 300px) {
    .single-value {
      font-size: $kui-font-size-70;
      line-height: $kui-line-height-70;
    }
  }

  @container (min-width: 700px) {
    .single-value {
      font-size: $kui-font-size-100;
      line-height: $kui-line-height-100;
    }
  }
}
</style>
