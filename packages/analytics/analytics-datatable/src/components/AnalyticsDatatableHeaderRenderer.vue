<template>
  <button
    class="analytics-datatable-header"
    :class="{
      'is-sortable': params.enableSorting,
      'is-sorted': sortDirection,
    }"
    :data-testid="`analytics-datatable-header-${columnKey}`"
    type="button"
    @click="handleSort"
  >
    <span class="header-label">{{ params.displayName }}</span>

    <KTooltip
      v-if="column?.tooltip"
      class="header-tooltip"
      :kpop-attributes="{ target: 'body' }"
      :text="column.tooltip"
    >
      <span class="header-tooltip-trigger">
        <InfoIcon
          class="header-tooltip-icon"
          decorative
          :size="KUI_ICON_SIZE_30"
        />
      </span>
    </KTooltip>

    <span
      v-if="params.enableSorting"
      class="header-sort-icon"
      :data-testid="`analytics-datatable-sort-${columnKey}`"
    >
      <component
        :is="sortIcon"
        decorative
        :size="KUI_ICON_SIZE_30"
      />
    </span>
  </button>
</template>

<script setup lang="ts">
import type { AnalyticsDatatableHeader } from '../types'
import type { IHeaderParams, SortDirection } from 'ag-grid-community'
import { ArrowDownIcon, ArrowUpIcon, InfoIcon, SwapSortIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { computed, onBeforeUnmount, ref } from 'vue'

type HeaderContext = {
  columnsByKey: Map<string, AnalyticsDatatableHeader<Record<string, any>>>
}

type HeaderParams = IHeaderParams<Record<string, any>, HeaderContext>
type SortIconKey = Exclude<SortDirection, null> | 'none'

const sortIconByDirection = {
  asc: ArrowUpIcon,
  desc: ArrowDownIcon,
  none: SwapSortIcon,
} as const

const {
  params,
} = defineProps<{
  params: HeaderParams
}>()

const columnKey = computed(() => params.column.getId())
const column = computed(() => params.context.columnsByKey.get(columnKey.value))
const sortDirection = ref<SortDirection | undefined>(params.column.getSort())
const sortIcon = computed(() => sortIconByDirection[(sortDirection.value ?? 'none') as SortIconKey])

const handleSortChange = () => {
  sortDirection.value = params.column.getSort()
}

params.column.addEventListener('sortChanged', handleSortChange)

onBeforeUnmount(() => {
  params.column.removeEventListener('sortChanged', handleSortChange)
})

const handleSort = (event: MouseEvent) => {
  if (!params.enableSorting) {
    return
  }

  params.progressSort(event.shiftKey)
}
</script>

<style lang="scss">
.analytics-datatable-header {
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  box-shadow: none;
  box-sizing: border-box;
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  display: inline-flex;
  flex-wrap: nowrap;
  font-family: var(--kui-font-family-text, $kui-font-family-text);
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  gap: var(--kui-space-30, $kui-space-30);
  height: 100%;
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  margin: 0;
  min-width: 0;
  padding: 0;
  text-align: left;
  width: 100%;

  &.is-sortable {
    cursor: pointer;
  }

  &.is-sorted {
    color: var(--kui-color-text-primary, $kui-color-text-primary);
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    border-radius: var(--kui-border-radius-10, $kui-border-radius-10);
    box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
  }
}

.header-label {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-tooltip,
.header-tooltip-trigger,
.header-sort-icon {
  display: inline-flex;
  flex-shrink: 0;
}

.header-tooltip-trigger {
  cursor: help;
}

.header-tooltip-icon {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
}

.header-sort-icon {
  color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
}

.is-sorted .header-sort-icon {
  color: var(--kui-color-text-primary, $kui-color-text-primary);
}

.header-tooltip :deep(svg),
.header-sort-icon :deep(svg) {
  color: currentColor;
  display: block;
  flex-shrink: 0;
}
</style>
