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
        class="legend"
        :style="{ background: fillStyle, 'border-color': strokeStyle }"
      />
      <div
        class="label-container"
        :class="{ 'strike-through': !isDatasetVisible(datasetIndex, index) }"
      >
        <div
          class="label"
          :class="{ 'truncate-label' : shouldTruncate }"
          :title="position === ChartLegendPosition.Bottom && text"
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
import { inject, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue'
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
const shouldTruncate = ref(false)
const showValues = inject('showLegendValues', true)
const position = inject('legendPosition', ref(ChartLegendPosition.Right))
const legendItemsTracker = ref<LegendItem[]>([])

// Check if the legend wraps by comparing the top position of each item.
const doesTheLegendWrap = () => {
  const element = legendContainerRef.value
  if (!element || !legendItemsRef.value || element.children.length === 0) {
    return 0
  }

  const previousTop = element.children[0].getBoundingClientRect().top
  for (const item of legendItemsRef.value) {
    const currentTop = item.getBoundingClientRect().top
    // If the top position of the current item is
    // different from the previous item, that means
    // there is a new row.
    if (currentTop > previousTop) {
      return true
    }
  }
  return false
}

const checkForWrap = () => {
  if (legendContainerRef.value && position.value === ChartLegendPosition.Bottom) {
    if (doesTheLegendWrap()) {
      shouldTruncate.value = true
    } else {
      shouldTruncate.value = false
    }
  }
}

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
  checkForWrap()
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
    checkForWrap()
    formatGrid()
  }
  oldWidth.value = newWidth
  oldHeight.value = newHeight
}, 100))

watch(() => position.value, () => {
  checkForWrap()
  formatGrid()
})

onMounted(() => {
  legendItemsTracker.value = props.items
  if (legendContainerRef.value) {
    resizeObserver.observe(legendContainerRef.value)
  }

  window.requestAnimationFrame(() => {
    checkForWrap()
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
    [ChartLegendPosition.Right]: 'vertical',
    [ChartLegendPosition.Bottom]: 'horizontal',
    [ChartLegendPosition.Hidden]: 'hidden',
  }[position]
}

</script>

<style lang="scss" scoped>
.legend-container {
  display: flex;
  max-height: inherit;
  -ms-overflow-style: thin;
  overflow-x: hidden;
  overflow-y: scroll;
  padding-left: $kui-space-50;
  scrollbar-width: thin;

  &.vertical {
    flex-direction: column;
    max-height: 400px;
    max-width: 15%;
    word-break: break-word;

    // Allow legend to expand horizontally at lower resolutions
    @media (max-width: ($kui-breakpoint-phablet - 1px)) {
      flex-direction: row;
      height: 20%;
      max-width: 100%;
      width: 100%;
    }
  }

  &.horizontal {
    display: grid;
    justify-content: center;
    max-height: 12%;
    width: 99%;
    .truncate-label {
      max-width: 15ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    li {
      margin-top: 0;

      .legend {
        margin-top: $kui-space-50;
      }
      .label {
        line-height: $kui-line-height-50;
      }
    }
  }

  &::-webkit-scrollbar-track {
    background-color: $kui-color-background;
    border-radius: 10px;
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $kui-color-background-disabled;
    border-radius: 10px;
  }

  // Individual legend item
  li {
    align-items: start;
    cursor: pointer;
    display: flex;
    line-height: 1;
    margin-top: $kui-space-60;

    .legend {
      flex: 0 0 14px;
      height: 3px;
      margin-right: $kui-space-50;
      margin-top: $kui-space-20;
    }

    .label {
      font-size: $kui-font-size-30;
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
