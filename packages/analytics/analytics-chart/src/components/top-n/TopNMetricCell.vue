<script setup lang="ts">
import type { TopNThresholdType } from '../../utils/topn-columns'

import { datavisPalette } from '../../utils/colors'

import { computed } from 'vue'

const props = defineProps<{
  display: string
  barRatio?: number
  threshold?: TopNThresholdType
  valueWidth?: number
}>()

const hasBar = computed((): boolean => props.barRatio !== undefined)

const defaultBarColor = datavisPalette[1]
</script>

<template>
  <span
    class="top-n-metric-cell"
    :class="{
      'top-n-metric-cell--bar': hasBar,
      [`top-n-metric-cell--bar-${threshold}`]: hasBar && !!threshold,
      [`top-n-metric-cell--text-${threshold}`]: !hasBar && !!threshold,
    }"
    :data-threshold="threshold"
  >
    <span
      class="top-n-metric-cell-value"
      :style="valueWidth ? { minWidth: `${valueWidth}ch` } : undefined"
    >
      {{ display }}
    </span>
    <span
      v-if="hasBar"
      class="top-n-metric-cell-bar"
      data-testid="top-n-metric-cell-bar"
    >
      <span
        class="top-n-metric-cell-bar-fill"
        :style="{ width: `${barRatio! * 100}%` }"
      />
    </span>
  </span>
</template>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.top-n-metric-cell {
  align-items: center;
  display: inline-flex;
  gap: var(--kui-space-50, $kui-space-50);
  width: 100%;

  &-value {
    font-variant-numeric: tabular-nums;
  }

  &-bar {
    background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
    border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
    flex: 1 1 auto;
    height: 8px;
    min-width: 80px;
    overflow: hidden;
  }

  &-bar-fill {
    background-color: v-bind(defaultBarColor);
    border-radius: inherit;
    display: block;
    height: 100%;
  }

  &--bar &-value {
    flex-shrink: 0;
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  &--bar-warning &-bar-fill {
    background-color: var(--kui-color-background-warning, $kui-color-background-warning);
  }

  &--bar-error &-bar-fill {
    background-color: var(--kui-color-background-danger, $kui-color-background-danger);
  }

  &--text-warning,
  &--text-error {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  &--text-warning {
    color: var(--kui-color-text-warning, $kui-color-text-warning);
  }

  &--text-error {
    color: var(--kui-color-text-danger, $kui-color-text-danger);
  }
}
</style>
