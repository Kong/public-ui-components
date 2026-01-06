<template>
  <ul
    v-if="position !== ChartLegendPosition.Hidden"
    class="legend-container"
    data-testid="legend"
  >
    <li
      v-for="{ fillStyle, strokeStyle, text, datasetIndex, index, value, isSegmentEmpty } in (items as any[])"
      :key="text"
      @click="handleLegendItemClick(datasetIndex, index)"
    >
      <div
        class="square-marker"
        :style="{ background: fillStyle, 'border-color': strokeStyle }"
      />
      <KTooltip>
        <div
          class="label-container"
          :class="{ 'strike-through': !isDatasetVisible(datasetIndex, index) }"
          :title="value && showValues ? `${text}: ${value.formatted}` : text"
        >
          <div
            class="label truncate-label"
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
        <template
          v-if="isSegmentEmpty"
          #content
        >
          <div class="tooltip-content">
            {{ i18n.t('emptyEntityInfo') }}
          </div>
        </template>
      </KTooltip>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ChartLegendPosition } from '../../enums'
import { Chart } from 'chart.js'
import { inject, ref, type PropType } from 'vue'
import type { EnhancedLegendItem } from 'src/types'
import composables from '../../composables'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  items: {
    type: Object as PropType<EnhancedLegendItem[]>,
    required: true,
  },
  chartInstance: {
    type: Object,
    required: false,
    default: () => null,
  },
})

const { i18n } = composables.useI18n()
const showValues = inject('showLegendValues', false)
const position = inject('legendPosition', ref(ChartLegendPosition.Bottom))

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

// Donut charts contain only a single dataset; it is safe to default datasetIndex `0`
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
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.legend-container {
  box-sizing: border-box;
  display: flex;
  flex-grow: 1; // we want to push the chart up, so this takes all remaining space
  flex-wrap: wrap;
  gap: 8px 9px;
  justify-content: center;
  margin: 0 0 0 0;
  max-height: inherit;
  overflow: auto;
  -ms-overflow-style: thin;
  padding: var(--kui-space-40, $kui-space-40) calc(5% + var(--kui-space-20, $kui-space-20));
  width: 100%;

  // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
  // stylelint-disable-next-line no-duplicate-selectors
  & {
    @include scrollbarBase;
  }

  // Individual legend item
  li {
    align-items: center;
    cursor: pointer;
    display: flex;
    line-height: 1;
    margin: 0;

    // Color bar preceding label
    .square-marker {
      height: 8px;
      margin: var(--kui-space-0, $kui-space-0);
      margin-right: var(--kui-space-30, $kui-space-30);
      width: 8px;
    }

    .label {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      white-space: nowrap;

      &.truncate-label {
        max-width: 20ch;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .sub-label {
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      word-break: none;
    }

    .strike-through {
      text-decoration: line-through;
    }

    .empty {
      font-style: italic;
    }

    .tooltip-content {
      max-width: 40ch;
    }
  }
}
</style>
