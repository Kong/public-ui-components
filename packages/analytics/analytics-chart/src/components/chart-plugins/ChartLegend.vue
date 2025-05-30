<template>
  <ul
    v-if="position !== ChartLegendPosition.Hidden"
    ref="legendContainerRef"
    class="legend-container"
    :class="positionToClass(position)"
    data-testid="legend"
  >
    <li
      v-for="{ fillStyle, strokeStyle, text, datasetIndex, index, value, isSegmentEmpty } in (items as any[])"
      :key="text"
      ref="legendItemsRef"
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
        >
          <div
            class="label"
            :class="{ 'truncate-label' : shouldTruncate, empty: isSegmentEmpty }"
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
import { inject, onBeforeUnmount, onMounted, ref, watch, type PropType, computed } from 'vue'
import { KUI_SPACE_100, KUI_SPACE_80, KUI_SPACE_110 } from '@kong/design-tokens'
import { debounce } from '../../utils'
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
const legendContainerRef = ref<HTMLElement>()
const legendItemsRef = ref<HTMLElement[]>([])
const showValues = inject('showLegendValues', true)
const position = inject('legendPosition', ref(ChartLegendPosition.Right))
const legendItemsTracker = ref<EnhancedLegendItem[]>([])
const legendHeight = ref<string>(KUI_SPACE_80)

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

const shouldTruncate = computed(() => {
  return props.items.length > 2 || position.value === ChartLegendPosition.Right
})

const checkForWrap = () => {
  if (legendContainerRef.value && position.value === ChartLegendPosition.Bottom) {
    if (doesTheLegendWrap()) {
      // Allow for two rows of legend items
      legendHeight.value = KUI_SPACE_110
    } else {
      // Only need space for one row of legend items
      legendHeight.value = KUI_SPACE_80
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

  checkForWrap()
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

const positionToClass = (position: `${ChartLegendPosition}`) => {
  return {
    [ChartLegendPosition.Right]: 'vertical',
    [ChartLegendPosition.Bottom]: 'horizontal',
    [ChartLegendPosition.Hidden]: 'hidden',
  }[position]
}
</script>

<style lang="scss" scoped>
@use "../../styles/globals" as *;

.legend-container {
  display: flex;
  margin: $kui-space-30 0 0 0;
  max-height: inherit;
  -ms-overflow-style: thin;
  overflow-x: hidden;
  overflow-y: auto;
  padding-left: 0;

  // fixing mixed-decls deprecation: https://sass-lang.com/d/mixed-decls
  // stylelint-disable-next-line no-duplicate-selectors
  & {
    @include scrollbarBase;
  }

  &.vertical {
    flex-direction: column;
    justify-content: flex-start;
    max-height: 90%;
    max-width: 15%;
    min-width: 10%;
    padding-left: $kui-space-50;
    row-gap: $kui-space-60;

    .truncate-label {
      max-width: 12ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    li {
      // Legend on right side of chart allows for two lines of text
      .legend {
        margin-top: $kui-space-20;
      }
    }

    // Allow legend to expand horizontally at lower resolutions
    @media (max-width: ($kui-breakpoint-phablet - 1px)) {
      column-gap: $kui-space-50;
      display: grid;
      grid-template-columns: repeat(auto-fit, 12ch);
      height: 40px;
      justify-content: center;
      max-width: 99% !important;

      .sub-label {
        display: none;
      }
    }
  }

  &.horizontal {
    column-gap: $kui-space-50;
    display: grid;
    height: v-bind('legendHeight');
    justify-content: center;  // Legend below chart only allows one line of text
    width: 99%;

    .truncate-label {
      max-width: 20ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    li {
      align-items: center;
      margin: $kui-space-0;

      .label {
        line-height: $kui-line-height-40;
        padding-right: $kui-space-10;  // Ensure italics text doesn't get cut off.
        white-space: nowrap;
      }
    }
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
      margin: $kui-space-0;
      margin-right: $kui-space-30;
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

    .empty {
      font-style: italic;
    }

    .tooltip-content {
      max-width: 40ch;
    }
  }
}
</style>
