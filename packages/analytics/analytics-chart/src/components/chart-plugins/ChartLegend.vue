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
import { Chart } from 'chart.js'
import { computed, inject, ref, watch } from 'vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  items: {
    type: Array,
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

// Return the number of rows for a grid layout
// by cmparing the top position of each item.
const numberOfRows = computed(() => {
  const element = legendContainerRef.value
  if (!element || !legendItemsRef.value || element.children.length === 0) {
    return 0
  }

  let numberOfRows = 1
  let previousTop = element.children[0].getBoundingClientRect().top
  for (const item of legendItemsRef.value) {
    const currentTop = item.getBoundingClientRect().top
    // If the top position of the current item is
    // different from the previous item, that means
    // there is a new row.
    if (currentTop !== previousTop) {
      numberOfRows++
      previousTop = currentTop
    }
  }

  return numberOfRows
})

const checkForWrap = () => {
  if (legendContainerRef.value && position.value === ChartLegendPosition.Bottom) {
    if (numberOfRows.value > 1) {
      shouldTruncate.value = true
    } else {
      shouldTruncate.value = false
    }
  }
}

watch(() => props.items, checkForWrap, { immediate: true, flush: 'post' })

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

const showValues = inject('showLegendValues', true)
const position = inject('legendPosition', ref(ChartLegendPosition.Right))

</script>

<style lang="scss" scoped>
.legend-container {
  display: flex;
  max-height: inherit;
  min-width: 10%;
  -ms-overflow-style: thin;
  overflow-x: hidden;
  overflow-y: scroll;
  padding-left: $kui-space-50;
  scrollbar-width: thin;

  &.vertical {
    flex-direction: column;
    max-height: 400px;
    max-width: 200px;

    .legend {
      margin-top: $kui-space-30;
    }

    // Allow legend to expand horizontally at lower resolutions
    @media (max-width: ($kui-breakpoint-phablet - 1px)) {
      flex-direction: row;
      max-width: 100%;
      padding-top: $kui-space-50;
      width: 100%;
    }
  }

  &.horizontal {
    column-gap: $kui-space-10;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12ch, max-content));
    justify-content: center;
    max-height: $kui-space-150;
    width: 100%;

    .legend {
      margin-top: $kui-space-30;
    }

    .label {
      width: 14ch;
    }
    .truncate-label {
      max-width: 10ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    li {
      display: flex;
      justify-content: start;
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
    .legend {
      flex: 0 0 14px;
      height: 3px;
      margin-right: $kui-space-50;
    }

    cursor: pointer;
    display: flex;
    height: fit-content;
    margin: $kui-space-50;

    .label {
      font-size: $kui-font-size-30;
    }

    .sub-label {
      font-size: $kui-font-size-20;
      word-break: none;
    }

    .strike-through {
      text-decoration: line-through;
    }
  }
}
</style>
