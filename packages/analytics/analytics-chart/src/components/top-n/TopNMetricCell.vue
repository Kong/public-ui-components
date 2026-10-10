<script setup lang="ts">
import type { TopNThresholdType } from '../../utils/topn-columns'

defineProps<{
  display: string
  relative?: string
  threshold?: TopNThresholdType
  hasBar?: boolean
}>()
</script>

<template>
  <span
    class="top-n-metric-cell"
    :class="{
      'top-n-metric-cell--bar': hasBar,
      [`top-n-metric-cell--text-${threshold}`]: !hasBar && !!threshold,
    }"
    :data-threshold="threshold"
  >
    <span class="top-n-metric-cell-value">{{ display }}</span>
    <span
      v-if="relative"
      class="top-n-metric-cell-relative"
      data-testid="top-n-metric-cell-relative"
    >({{ relative }})</span>
  </span>
</template>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.top-n-metric-cell {
  align-items: baseline;
  display: inline-flex;
  font-feature-settings: 'case';
  font-variant-numeric: tabular-nums;
  gap: var(--kui-space-20, $kui-space-20);

  &-relative {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
  }

  &--bar &-value {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  &--text-warning &-value,
  &--text-error &-value {
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
