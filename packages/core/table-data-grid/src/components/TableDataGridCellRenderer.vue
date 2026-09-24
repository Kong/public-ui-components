<template>
  <span
    class="table-data-grid-cell-renderer"
    :class="{
      'table-data-grid-cell-renderer--bar': hasBar,
      'table-data-grid-cell-renderer--percentage': !!relativeValue,
      [`table-data-grid-cell-renderer--text-${thresholdType}`]: !hasBar && !!thresholdType,
    }"
    :data-threshold="thresholdType"
  >
    <component
      :is="matchedIcon"
      v-if="matchedIcon"
      class="table-data-grid-cell-icon"
      data-testid="table-data-grid-cell-icon"
      decorative
      size="var(--kui-icon-size-30, 16px)"
    />
    <component :is="renderCellContent">
      <template #default>
        <KTooltip
          class="table-data-grid-cell-tooltip"
          :disabled="!isOverflowing"
          :kpop-attributes="{ popoverDelay: 400 }"
          max-width="300"
          placement="bottom-start"
          :target="tooltipTarget"
          :text="displayValue"
        >
          <span
            ref="contentElement"
            class="table-data-grid-cell-content"
          >{{ displayValue }}</span>
        </KTooltip>
      </template>
    </component>
    <span
      v-if="relativeValue"
      class="table-data-grid-cell-relative"
      data-testid="table-data-grid-cell-relative"
    >({{ relativeValue }})</span>
    <span
      v-if="hasBar"
      class="table-data-grid-cell-bar"
      data-testid="table-data-grid-cell-bar"
      :data-threshold="thresholdType"
    >
      <span
        class="table-data-grid-cell-bar-fill"
        data-testid="table-data-grid-cell-bar-fill"
        :style="{ width: `${barWidth}%` }"
      />
    </span>
  </span>
</template>

<script setup lang="ts">
import type {
  TableDataGridCellSlotProps,
  TableDataGridHeader,
} from '../types'
import type { ICellRendererParams } from 'ag-grid-community'
import type { FunctionalComponent, Ref, Slots } from 'vue'
import {
  computed,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  renderSlot,
  ref,
  shallowRef,
  watch,
} from 'vue'
import {
  formatPercentage,
  getBarRatio,
  getCellIcon,
  getThresholdType,
  toFiniteNumber,
  type TableDataGridPresentationContext,
} from '../utils/tableDataGridPresentation'

type CellRendererParams = ICellRendererParams<Record<string, unknown>> & {
  /** Set internally via `cellRendererParams` so the renderer can resolve the
   * host slot and build its payload without leaking AG Grid's own `column`. */
  headerDef?: TableDataGridHeader
  context?: {
    cells?: { slots?: Slots, tooltipTarget?: Readonly<Ref<string | HTMLElement>> }
    presentation?: TableDataGridPresentationContext
  }
}

defineOptions({
  name: 'TableDataGridCellRenderer',
})

const {
  params,
} = defineProps<{
  params: CellRendererParams
}>()

// AG Grid refreshes reused renderers through the exposed refresh hook, not by
// updating Vue props. Keep only the top-level params reference reactive.
const currentParams = shallowRef(params)
const contentElement = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)
const header = computed<TableDataGridHeader>(() => currentParams.value.headerDef ?? {
  key: '',
  label: '',
})
const presentation = computed(() => currentParams.value.context?.presentation)
const tooltipTarget = computed(() => currentParams.value.context?.cells?.tooltipTarget?.value ?? 'body')
const displayValue = computed(() => {
  const params = currentParams.value

  if (params.valueFormatted !== undefined && params.valueFormatted !== null) {
    return String(params.valueFormatted)
  }

  return String(params.value ?? '')
})

const rawValue = computed(() => currentParams.value.value)
const numericValue = computed(() => toFiniteNumber(rawValue.value))
const stats = computed(() => presentation.value?.stats[header.value.key])
const isNumericUnpaginated = computed(() => (
  presentation.value?.mode === 'unpaginated' && header.value.dataType === 'number'
))
const relativeValue = computed(() => {
  if (!isNumericUnpaginated.value || !header.value.showPercentage || !stats.value) {
    return undefined
  }

  const value = numericValue.value

  if (value === null || stats.value.sum <= 0) {
    return undefined
  }

  const percentage = value / stats.value.sum * 100

  return header.value.percentageFormatter?.(percentage)
    ?? formatPercentage(percentage, presentation.value?.locale)
})
const hasBar = computed(() => (
  isNumericUnpaginated.value && !!header.value.bar
  && (numericValue.value !== null || rawValue.value === null || rawValue.value === undefined)
))
const barWidth = computed(() => (
  hasBar.value && stats.value
    ? getBarRatio(numericValue.value, stats.value, header.value.bar) * 100
    : 0
))
const thresholdType = computed(() => (
  isNumericUnpaginated.value && numericValue.value !== null
    ? getThresholdType(numericValue.value, header.value.thresholds)
    : undefined
))
const matchedIcon = computed(() => getCellIcon({
  icons: header.value.icons,
  rawValue: rawValue.value,
}))

// Props passed to a `[header.key]` slot when the host provides one.
const slotPayload = computed<TableDataGridCellSlotProps>(() => ({
  column: header.value,
  refreshCell: () => {
    const node = currentParams.value.node

    if (node) {
      currentParams.value.api.refreshCells({ force: true, rowNodes: [node] })
    }
  },
  row: currentParams.value.data ?? {},
  rowIndex: currentParams.value.node?.rowIndex ?? 0,
  rowValue: currentParams.value.value,
  selected: currentParams.value.node?.isSelected() ?? false,
}))

const renderCellContent: FunctionalComponent = (_, { slots }) => {
  const colId = currentParams.value.colDef?.colId
  const hostSlots = currentParams.value.context?.cells?.slots

  if (!colId || !hostSlots?.[colId]) {
    return slots.default?.()
  }

  return h(
    'span',
    { class: 'table-data-grid-cell-slot-content' },
    renderSlot(hostSlots, colId, slotPayload.value, () => slots.default?.() ?? []),
  )
}

let resizeObserver: ResizeObserver | undefined
let animationFrame: number | undefined
let isUnmounted = false

const measureOverflow = () => {
  const element = contentElement.value
  isOverflowing.value = !!element && element.scrollWidth > element.clientWidth
}

const scheduleOverflowMeasurement = () => {
  if (isUnmounted) {
    return
  }

  if (animationFrame !== undefined) {
    cancelAnimationFrame(animationFrame)
  }

  animationFrame = requestAnimationFrame(() => {
    animationFrame = undefined
    measureOverflow()
  })
}

const observeContentElement = (element: HTMLElement | null) => {
  resizeObserver?.disconnect()

  if (element) {
    resizeObserver?.observe(element)

    const cellElement = element.closest<HTMLElement>('.ag-cell')
    if (cellElement) {
      resizeObserver?.observe(cellElement)
    }
  }

  scheduleOverflowMeasurement()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(scheduleOverflowMeasurement)
  observeContentElement(contentElement.value)
})

watch(contentElement, observeContentElement)

onUnmounted(() => {
  isUnmounted = true
  resizeObserver?.disconnect()

  if (animationFrame !== undefined) {
    cancelAnimationFrame(animationFrame)
  }
})

defineExpose({
  refresh(nextParams: CellRendererParams) {
    currentParams.value = nextParams
    nextTick(scheduleOverflowMeasurement)

    return true
  },
})
</script>

<style lang="scss">
/* AG Grid separately mounts framework renderers, so parent-scoped selectors do not reach this DOM. */
.table-data-grid-cell-renderer,
.table-data-grid-cell-tooltip,
.table-data-grid-cell-content,
.table-data-grid-cell-slot-content {
  display: block;
  min-width: 0;
  width: 100%;
}

.table-data-grid-cell-renderer {
  align-items: center;
  display: flex;
  font-feature-settings: "case";
  font-variant-numeric: tabular-nums;
  gap: var(--kui-space-20, $kui-space-20);
  min-width: 0;
  width: 100%;
}

.table-data-grid-cell-content,
.table-data-grid-cell-slot-content,
.table-data-grid-cell-relative {
  white-space: nowrap;
}

.table-data-grid-cell-relative {
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
}

.table-data-grid-cell-renderer--bar .table-data-grid-cell-content,
.table-data-grid-cell-renderer--bar .table-data-grid-cell-slot-content,
.table-data-grid-cell-renderer--text-warning .table-data-grid-cell-content,
.table-data-grid-cell-renderer--text-warning .table-data-grid-cell-slot-content,
.table-data-grid-cell-renderer--text-error .table-data-grid-cell-content,
.table-data-grid-cell-renderer--text-error .table-data-grid-cell-slot-content {
  font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
}

.table-data-grid-cell-renderer--text-warning {
  color: var(--kui-color-text-warning, $kui-color-text-warning);
}

.table-data-grid-cell-renderer--text-error {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
}

.table-data-grid-cell-renderer--bar .table-data-grid-cell-content,
.table-data-grid-cell-renderer--bar .table-data-grid-cell-slot-content,
.table-data-grid-cell-renderer--bar .table-data-grid-cell-tooltip,
.table-data-grid-cell-renderer--percentage .table-data-grid-cell-slot-content,
.table-data-grid-cell-renderer--percentage .table-data-grid-cell-tooltip,
.table-data-grid-cell-renderer--percentage .table-data-grid-cell-content {
  flex: 0 1 auto;
  width: auto;
}

.table-data-grid-cell-bar {
  background-color: var(--kui-color-background-neutral-weaker, #{$kui-color-background-neutral-weaker});
  border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
  display: block;
  flex: 1 1 80px;
  height: 8px;
  min-width: 80px;
  overflow: hidden;
  width: 100%;
}

.table-data-grid-cell-bar-fill {
  background-color: #6a86d2;
  border-radius: inherit;
  display: block;
  height: 100%;
}

.table-data-grid-cell-bar[data-threshold="warning"] .table-data-grid-cell-bar-fill {
  background-color: var(--kui-color-background-warning, #{$kui-color-background-warning});
}

.table-data-grid-cell-bar[data-threshold="error"] .table-data-grid-cell-bar-fill {
  background-color: var(--kui-color-background-danger, #{$kui-color-background-danger});
}

.table-data-grid-cell-icon {
  flex: 0 0 auto;
  height: var(--kui-icon-size-30, 16px);
  width: var(--kui-icon-size-30, 16px);
}

.table-data-grid-cell-content {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
