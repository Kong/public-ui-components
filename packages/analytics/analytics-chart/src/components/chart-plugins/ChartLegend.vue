<template>
  <ul
    v-if="position !== ChartLegendPosition.Hidden"
    class="legend-container"
    data-testid="legend"
  >
    <li
      v-for="({ fillStyle, strokeStyle, text, datasetIndex, index, value, isSegmentEmpty, isKey, lineDash, isVisible }, listIndex) in (legendEntries as any[])"
      :key="legendItemKey({ datasetIndex, index, isKey }, listIndex)"
      :class="{ 'legend-key': isKey }"
      @click="isKey ? undefined : handleLegendItemClick(datasetIndex, index)"
    >
      <!-- A native button makes the toggle focusable; Enter and Space fire a click that bubbles to the li. -->
      <component
        :is="isKey ? 'div' : 'button'"
        :aria-pressed="isKey ? undefined : isVisible"
        class="legend-item"
        :type="isKey ? undefined : 'button'"
      >
        <svg
          v-if="lineDash?.length"
          aria-hidden="true"
          class="line-marker"
          height="2"
          width="16"
        >
          <line
            :stroke="strokeStyle"
            :stroke-dasharray="lineDash.join(' ')"
            stroke-width="2"
            x1="0"
            x2="16"
            y1="1"
            y2="1"
          />
        </svg>
        <div
          v-else
          class="square-marker"
          :style="{ background: fillStyle, 'border-color': strokeStyle }"
        />
        <KTooltip>
          <div
            class="label-container"
            :class="{ 'strike-through': !isVisible, 'inline-value': isKey }"
            :title="value && (showValues || isKey) ? `${text}: ${value.formatted}` : text"
          >
            <div
              class="label truncate-label"
            >
              {{ text }}
            </div>
            <div
              v-if="value && (showValues || isKey)"
              class="sub-label"
            >
              <span v-if="isKey">-</span> {{ value.formatted }}
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
      </component>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ChartLegendPosition } from '../../enums'
import { Chart } from 'chart.js'
import { computed, inject, ref, type PropType } from 'vue'
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

const legendItemKey = (
  { datasetIndex, index, isKey }: Pick<EnhancedLegendItem, 'datasetIndex' | 'index' | 'isKey'>,
  listIndex: number,
): string => {
  if (isKey) {
    return `key-${listIndex}`
  }

  return `dataset-${datasetIndex ?? 0}-${index ?? 0}`
}

const handleLegendItemClick = (datasetIndex: number = 0, segmentIndex?: number): void => {
  if (props.chartInstance === null) {
    // https://konghq.atlassian.net/browse/KHCP-4679
    return
  }

  const chart = (props.chartInstance instanceof Chart) ? props.chartInstance : props.chartInstance.chart
  const visible = isDatasetVisible(datasetIndex, segmentIndex)
  const meta = chart.getDatasetMeta(datasetIndex)

  if (!meta.dataset && segmentIndex !== undefined) {
    // Donut charts have exactly 1 dataset, so the datasetIndex is irrelevant here. The visibility
    // of this "segment" is stored in a different place in chart.js, which is why the `toggleDataVisibility`
    // method works here. https://www.chartjs.org/docs/latest/developers/api.html#toggledatavisibility-index
    chart.toggleDataVisibility(segmentIndex)
  } else if (visible) {
    chart.hide(datasetIndex, segmentIndex)
  } else {
    chart.show(datasetIndex, segmentIndex)
  }

  chart.update()
}

// Donut charts contain only a single dataset; it is safe to default datasetIndex `0`
// since all other chart types will always have this filled defined.
const isDatasetVisible = (datasetIndex: number = 0, segmentIndex?: number): boolean => {
  if (props.chartInstance === null || props.chartInstance.chart === null) {
    // https://konghq.atlassian.net/browse/KHCP-4679
    return true
  }

  const chart = (props.chartInstance instanceof Chart) ? props.chartInstance : props.chartInstance.chart
  const datasetMeta = chart.getDatasetMeta(datasetIndex)

  if (datasetMeta.dataset || segmentIndex === undefined) {
    return chart.isDatasetVisible(datasetIndex)
  } else {
    return chart.getDataVisibility(segmentIndex)
  }
}

// Chart.js owns visibility outside Vue; `items` is rebuilt after every chart update, so read it once per item here.
const legendEntries = computed(() => props.items.map((item) => ({
  ...item,
  isVisible: item.isKey || isDatasetVisible(item.datasetIndex, item.index),
})))
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.legend-container {
  box-sizing: border-box;
  display: flex;
  flex-grow: 1; // we want to push the chart up, so this takes all remaining space
  flex-wrap: wrap;
  // Same gap as KFilterGroup pills. Each item's hover fill covers half of it (see .legend-item), so neighboring fills meet but never overlap.
  gap: var(--kui-space-40, $kui-space-40);
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

    // A key shows a value that is not a dataset, thus it cannot be toggled.
    &.legend-key {
      cursor: default;
    }

    .legend-item {
      align-items: center;
      background: none;
      border: 0;
      border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
      color: inherit;
      cursor: inherit;
      display: flex;
      font: inherit;
      line-height: inherit;
      // The negative margin cancels the padding in layout: the hover fill extends into the gap, and items take
      // the same space as plain text. The chart reserves room for two rows of legend, and padding would push one out.
      margin: calc(-1 * var(--kui-space-20, $kui-space-20));
      padding: var(--kui-space-20, $kui-space-20);
      transition: background-color var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out, box-shadow var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
    }

    button.legend-item {
      &:hover {
        background-color: var(--kui-button-color-background-tertiary-hover, var(--kui-color-background-primary-weakest, $kui-color-background-primary-weakest));
      }

      &:focus-visible {
        box-shadow: var(--kui-button-shadow-focus, var(--kui-shadow-focus, $kui-shadow-focus));
        outline: none;
      }
    }

    .line-marker {
      margin-right: var(--kui-space-30, $kui-space-30);
      overflow: visible;
    }

    .label-container.inline-value {
      align-items: center;
      display: flex;
      gap: var(--kui-space-20, $kui-space-20);
    }

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

    // Neutral, not disabled: a hidden series is still a toggle the user can press.
    .strike-through {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
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
