<template>
  <ul
    v-if="position !== ChartLegendPosition.Hidden"
    class="legend-container"
    :class="positionToClass(position)"
    data-testid="legend"
  >
    <li
      v-for="{ fillStyle, strokeStyle, text, datasetIndex, index, value } in (itemsRef as any[])"
      :key="text"
      @click="handleLegendItemClick(datasetIndex, index)"
    >
      <div
        class="legend"
        :style="{ background: fillStyle, 'border-color': strokeStyle }"
      />
      <div
        :class="{ 'strike-through': !isDatasetVisible(datasetIndex, index) }"
      >
        <div class="label">
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
import { inject, ref, toRef } from 'vue'

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

const itemsRef = toRef(props, 'items')

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
  padding-left: var(--spacing-sm, 14px);
  scrollbar-width: thin;

  &.vertical {
    flex-direction: column;
    max-height: 400px;
    max-width: 200px;

    // Allow legend to expand horizontally at lower resolutions
    @media (max-width: 768px) {
      flex-direction: row;
      max-width: 100%;
      padding-top: var(--spacing-md, 16px);
      width: 100%;
    }
  }

  &.horizontal {
    column-gap: var(--spacing-sm, 14px);
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: var(--spacing-xs, 12px);
    max-height: 60px;
    width: 100%;

    .label {
      width: max-content;
    }
  }

  &::-webkit-scrollbar-track {
    background-color: var(--white);
    border-radius: 10px;
  }

  &::-webkit-scrollbar {
    width: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--grey-300, #E7E7EC);
    border-radius: 10px;
  }

  // Individual legend item
  li {
    .legend {
      flex: 0 0 14px;
      height: 3px;
      margin-right: var(--spacing-xs, 12px);
      margin-top: var(--spacing-xs, 12px);
    }

    cursor: pointer;
    display: flex;
    height: fit-content;
    margin: var(--spacing-xxs, 10px);

    .label {
      font-size: var(--type-sm, 14px);
    }

    .sub-label {
      font-size: var(--type-xs, 12px);
      word-break: none;
    }

    .strike-through {
      text-decoration: line-through;
    }
  }
}
</style>
