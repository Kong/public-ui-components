<template>
  <ul
    v-if="position !== ChartLegendPosition.Hidden"
    ref="legendContainerRef"
    class="legend-container"
    :class="positionToClass(position)"
    data-testid="legend"
  >
    <li
      v-for="{ fillStyle, strokeStyle, text, datasetIndex, index, value } in (items as any[])"
      :key="text"
      ref="legendItemsRef"
      @click="handleLegendItemClick(datasetIndex, index)"
    >
      <div
        class="square-marker"
        :style="{ background: fillStyle, 'border-color': strokeStyle }"
      />
      <div
        class="label-container"
        :class="{ 'strike-through': !isDatasetVisible(datasetIndex, index) }"
      >
        <div
          class="label"
          :class="{ 'truncate-label' : shouldTruncate }"
          :title="text"
        >
          {{ text }}
        </div>
        <div
          v-if="value && showValues"
          class="sub-label"
        >
          {{ value.formatted }}
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ChartLegendPosition } from '../../enums'
import { Chart, type LegendItem } from 'chart.js'
import { inject, onBeforeUnmount, onMounted, ref, watch, type PropType, computed } from 'vue'
import { KUI_SPACE_100 } from '@kong/design-tokens'
import { debounce } from '../../utils'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  items: {
    type: Object as PropType<LegendItem[]>,
    required: true,
  },
  chartInstance: {
    type: Object,
    required: false,
    default: () => null,
  },
})

const legendContainerRef = ref<HTMLElement>()
const legendItemsRef = ref<HTMLElement[]>([])
const showValues = inject('showLegendValues', true)
const position = inject('legendPosition', ref(ChartLegendPosition.Right))
const legendItemsTracker = ref<LegendItem[]>([])
const legendMaxHeight = ref<string>(KUI_SPACE_100)

const shouldTruncate = computed(() => {
  return props.items.length > 2 || position.value === ChartLegendPosition.Right
})

// Set the grid-template-columns style based on the width of the widest item
const formatGrid = () => {
  if (legendContainerRef.value && position.value === ChartLegendPosition.Bottom) {
    let maxWidth = 0

    legendItemsRef.value.forEach(item => {
      // Each <li> has two elements: the legend and the label.
      // Sum the width of each element to get the total width of the item.
      const width = Array.from(item.children).reduce((total, element) => {
        return total + (element as HTMLElement).offsetWidth
      }, 0)
      if (width > maxWidth) {
        maxWidth = width
      }
    })
    const padding = parseInt(KUI_SPACE_100, 10)
    legendContainerRef.value.style.gridTemplateColumns = `repeat(auto-fit, ${maxWidth + padding}px)`
  }
}

const legendItemsChanged = () => {
  if (props.items.length !== legendItemsTracker.value.length) {
    legendItemsTracker.value = props.items
    return true
  }

  for (let i = 0; i < props.items.length; i++) {
    if (props.items[i].text !== legendItemsTracker.value[i].text) {
      legendItemsTracker.value = props.items
      return true
    }
  }

  return false
}

watch(() => props.items, () => {
  if (legendItemsChanged()) {
    formatGrid()
  }
}, { immediate: true, flush: 'post' })

const oldWidth = ref(0)
const oldHeight = ref(0)

const resizeObserver = new ResizeObserver(debounce((entries: ResizeObserverEntry[]) => {

  const entry = entries[0]
  const newWidth = entry.contentRect.width
  const newHeight = entry.contentRect.height

  // Check if the resize is only in the X direction
  if (newWidth !== oldWidth.value && newHeight === oldHeight.value) {
    formatGrid()
  }
  oldWidth.value = newWidth
  oldHeight.value = newHeight
}, 100))

watch(() => position.value, () => {
  formatGrid()
})

onMounted(() => {
  legendItemsTracker.value = props.items
  if (legendContainerRef.value) {
    resizeObserver.observe(legendContainerRef.value)
  }

  window.requestAnimationFrame(() => {
    formatGrid()
  })
})

onBeforeUnmount(() => {
  if (legendContainerRef.value) {
    resizeObserver.unobserve(legendContainerRef.value)
  }
})

const handleLegendItemClick = (datasetIndex: number = 0, segmentIndex: number): void => {
  if (props.chartInstance === null) {
    // https://konghq.atlassian.net/browse/KHCP-4679
    return
  }

  const chart = (props.chartInstance instanceof Chart) ? props.chartInstance : props.chartInstance.chart
  const visible = isDatasetVisible(datasetIndex, segmentIndex)

  if (visible) {
    chart.hide(datasetIndex, segmentIndex)
  } else {
    chart.show(datasetIndex, segmentIndex)
  }

  chart.update()
}

// Doughnut charts contain only a single dataset; it is safe to default datasetIndex `0`
// since all other chart types will always have this filled defined.
const isDatasetVisible = (datasetIndex: number = 0, segmentIndex: number): boolean => {
  if (props.chartInstance === null || props.chartInstance.chart === null) {
    // https://konghq.atlassian.net/browse/KHCP-4679
    return true
  }

  const chart = (props.chartInstance instanceof Chart) ? props.chartInstance : props.chartInstance.chart
  const datasetMeta = chart.getDatasetMeta(datasetIndex)

  if (datasetMeta.dataset || segmentIndex === undefined) {
    return chart.isDatasetVisible(datasetIndex)
  } else {
    return !(datasetMeta.data.length && datasetMeta.data[segmentIndex].hidden)
  }
}

const positionToClass = (position: `${ChartLegendPosition}`) => {
  return {
    [ChartLegendPosition.Right]: 'right',
    [ChartLegendPosition.Bottom]: 'bottom',
    [ChartLegendPosition.Hidden]: 'hidden',
  }[position]
}
</script>

<style lang="scss" scoped>
@import '../../styles/base';

ul.legend-container {
  background: rgba(0,0,0, 0.03);
  border-radius: 6px;
  display: flex;
  margin: 0;
  max-height: inherit;
  -ms-overflow-style: thin;
  overflow-x: hidden;
  overflow-y: auto;
  padding: $kui-space-50;

  @include scrollbarBase;

  &.right {
    flex-direction: column;
    justify-content: flex-start;
    margin-left: $kui-space-30;
    max-height: 90%;
    min-width: 16%;
    row-gap: $kui-space-40;

    .truncate-label {
      max-width: 12ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // Allow legend to expand horizontally at lower resolutions
    @media (max-width: ($kui-breakpoint-phablet - 1px)) {
      @include legendAsGrid(v-bind('legendMaxHeight'));
    }
  }

  &.bottom {
    height: auto;
    @include legendAsGrid(v-bind('legendMaxHeight'));
  }

  // Individual legend item
  li {
    align-items: start;
    cursor: pointer;
    display: flex;
    line-height: 1;

    // Color bar preceding label
    .square-marker {
      height: 8px;
      margin: $kui-space-10 $kui-space-30 0 0;
      width: 8px;
    }

    .label {
      font-size: $kui-font-size-20;
    }

    .sub-label {
      font-size: $kui-font-size-20;
      line-height: $kui-line-height-20;
      word-break: none;
    }

    .strike-through {
      text-decoration: line-through;
    }
  }
}
</style>
