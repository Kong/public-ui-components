<template>
  <span class="table-data-grid-cell-renderer">
    <KTooltip
      class="table-data-grid-cell-tooltip"
      :disabled="!isOverflowing"
      :kpop-attributes="{ popoverDelay: 400 }"
      max-width="300"
      placement="bottom-start"
      target="body"
      :text="displayValue"
    >
      <span
        ref="contentElement"
        class="table-data-grid-cell-content"
      >{{ displayValue }}</span>
    </KTooltip>
  </span>
</template>

<script setup lang="ts">
import type { ICellRendererParams } from 'ag-grid-community'
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

type CellRendererParams = ICellRendererParams<Record<string, unknown>>

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
const displayValue = computed(() => (
  currentParams.value.valueFormatted ?? String(currentParams.value.value ?? '')
))

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

watch(contentElement, observeContentElement, { flush: 'post' })

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
.table-data-grid-cell-content {
  display: block;
  min-width: 0;
  width: 100%;
}

.table-data-grid-cell-content {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
