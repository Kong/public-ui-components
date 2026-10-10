<script setup lang="ts">
import type { TopNThresholdType } from '../../utils/topn-columns'

import { datavisPalette } from '../../utils/colors'

defineProps<{
  ratio: number
  threshold?: TopNThresholdType
}>()

const defaultBarColor = datavisPalette[1]
</script>

<template>
  <span
    class="top-n-metric-cell-bar"
    :class="{ [`top-n-metric-cell--bar-${threshold}`]: !!threshold }"
    data-testid="top-n-metric-cell-bar"
    :data-threshold="threshold"
  >
    <span
      class="top-n-metric-cell-bar-fill"
      :style="{ width: `${ratio * 100}%` }"
    />
  </span>
</template>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.top-n-metric-cell {
  &-bar {
    background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
    border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
    display: block;
    height: 8px;
    min-width: 80px;
    overflow: hidden;
    width: 100%;
  }

  &-bar-fill {
    background-color: v-bind(defaultBarColor);
    border-radius: inherit;
    display: block;
    height: 100%;
  }

  &--bar-warning &-bar-fill {
    background-color: var(--kui-color-background-warning, $kui-color-background-warning);
  }

  &--bar-error &-bar-fill {
    background-color: var(--kui-color-background-danger, $kui-color-background-danger);
  }
}
</style>
