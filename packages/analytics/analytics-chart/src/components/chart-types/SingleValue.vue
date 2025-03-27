<template>
  <div
    class="chart-parent"
    data-testid="single-value-parent"
  >
    <KEmptyState
      v-if="singleValue === null"
      class="single-value-error"
      icon-variant="error"
      title="Invalid configuration"
    />
    <span
      v-else
      class="single-value"
    >
      {{ formattedValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { AnalyticsExploreRecord, ExploreResultV4, AllAggregations } from '@kong-ui-public/analytics-utilities'

const props = defineProps({
  data: {
    type: Object as PropType<ExploreResultV4>,
    required: true,
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
  if (singleValue.value === null) {
    return ''
  }

  // if number is greater than 10M, display in millions
  if (singleValue.value >= 10000000) {
    return `${Math.floor(singleValue.value / 1000000)}M`
  }

  return singleValue.value.toLocaleString('en-US')
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
