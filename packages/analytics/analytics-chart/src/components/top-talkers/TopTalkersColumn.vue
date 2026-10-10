<script setup lang="ts">
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { TopNColumnOptionsMap } from '../../utils/topn-columns'

import { computed, toRef } from 'vue'
import { KSkeleton } from '@kong/kongponents'

import composables from '../../composables'
import TopTalkersCell from './TopTalkersCell.vue'

const { dimension, label, data, sizeMetric, columnOptions, isLoading } = defineProps<{
  dimension: string
  label?: string
  data?: ExploreResultV4
  sizeMetric?: string
  columnOptions?: TopNColumnOptionsMap
  isLoading?: boolean
}>()

const { i18n } = composables.useI18n()

const { column } = composables.useTopTalkersData(
  toRef(() => data),
  toRef(() => dimension),
  toRef(() => sizeMetric),
  toRef(() => columnOptions),
)

const heading = computed((): string => label || column.value.label)
const totalLabel = computed((): string => i18n.t('topTalkers.total', { value: column.value.total }))
</script>

<template>
  <div
    class="top-talkers-column"
    :data-dimension="dimension"
    data-testid="top-talkers-column"
  >
    <div class="top-talkers-column-header">
      <span
        class="top-talkers-column-label"
        data-testid="top-talkers-column-label"
      >{{ heading }}</span>
      <span
        v-if="!isLoading && column.cells.length"
        class="top-talkers-column-total"
        data-testid="top-talkers-column-total"
      >{{ totalLabel }}</span>
    </div>

    <KSkeleton
      v-if="isLoading"
      :delay-milliseconds="0"
      :table-columns="1"
      type="table"
    />

    <div
      v-else-if="!column.cells.length"
      class="top-talkers-column-empty"
      data-testid="top-talkers-column-empty"
    >
      {{ i18n.t('topTalkers.defaultEmptyStateTitle') }}
    </div>

    <div
      v-else
      class="top-talkers-column-cells"
    >
      <TopTalkersCell
        v-for="cell in column.cells"
        :key="cell.id"
        :cell="cell"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.top-talkers-column {
  display: flex;
  flex: 1 0 160px;
  flex-direction: column;
  gap: var(--kui-space-20, $kui-space-20);
  min-width: 160px;

  &-header {
    align-items: baseline;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    justify-content: space-between;
  }

  &-label {
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  }

  &-total {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    white-space: nowrap;
  }

  &-empty {
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    padding: var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);
  }

  &-cells {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--kui-space-30, $kui-space-30);
  }
}
</style>
