<script setup lang="ts">
import type { HeaderTag } from '@kong/kongponents'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { TopNColumnOptionsMap } from '../../utils/topn-columns'

import { computed, useSlots } from 'vue'
import { KCard, KEmptyState } from '@kong/kongponents'

import composables from '../../composables'
import TopTalkersColumn from './TopTalkersColumn.vue'

export interface TopTalkersGridColumn {
  dimension: string
  label?: string
  data?: ExploreResultV4
  isLoading?: boolean
}

const props = withDefaults(defineProps<{
  title?: string
  columns: TopTalkersGridColumn[]
  sizeMetric?: string
  columnOptions?: TopNColumnOptionsMap
  emptyStateTitle?: string
  errorMessage?: string
  titleTag?: HeaderTag
}>(), {
  title: '',
  sizeMetric: undefined,
  columnOptions: undefined,
  emptyStateTitle: '',
  errorMessage: '',
  titleTag: 'h2',
})

const { i18n } = composables.useI18n()
const slots = useSlots()

const hasColumns = computed((): boolean => !!slots.column)
const hasData = computed((): boolean => {
  return hasColumns.value || props.columns.some((column) => !!column.data?.data?.length || column.isLoading)
})
</script>

<template>
  <KCard
    class="kong-ui-public-top-talkers"
    :title-tag="titleTag"
  >
    <KEmptyState
      v-if="errorMessage"
      :action-button-visible="false"
      data-testid="top-talkers-error-state"
      icon-variant="error"
    >
      <template #title>
        {{ i18n.t('topTalkers.defaultErrorStateTitle') }}
      </template>
      <template #default>
        {{ errorMessage }}
      </template>
    </KEmptyState>

    <KEmptyState
      v-else-if="!hasData"
      :action-button-visible="false"
      data-testid="top-talkers-empty-state"
    >
      <template #title>
        {{ emptyStateTitle || i18n.t('topTalkers.defaultEmptyStateTitle') }}
      </template>
    </KEmptyState>

    <div
      v-else
      class="top-talkers-grid"
      data-testid="top-talkers-grid"
    >
      <slot
        v-for="column in columns"
        :key="column.dimension"
        :column="column"
        name="column"
      >
        <TopTalkersColumn
          :column-options="columnOptions"
          :data="column.data"
          :dimension="column.dimension"
          :is-loading="column.isLoading"
          :label="column.label"
          :size-metric="sizeMetric"
        />
      </slot>
    </div>
  </KCard>
</template>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.kong-ui-public-top-talkers {
  border: none;
  height: 100%;
  padding: 0 0 var(--kui-space-40, $kui-space-40);

  :deep(.card-content) {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }
}

.top-talkers-grid {
  align-items: stretch;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  height: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
