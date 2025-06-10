<template>
  <div
    v-if="showSkeleton"
    class="waterfall-skeleton"
  >
    <KSkeleton
      v-for="i in 4"
      :key="i"
    />
  </div>
  <div
    v-else
    ref="root"
    class="waterfall"
  >
    <div class="waterfall-sticky-header">
      <div class="waterfall-row">
        <div />
        <div class="minimap-wrapper">
          <div class="minimap" />
        </div>
      </div>

      <div class="waterfall-row">
        <div class="waterfall-actions">
          <KTooltip
            placement="top"
            :text="t('waterfall.action.expand_all')"
          >
            <KButton
              appearance="tertiary"
              icon
              size="small"
              @click="rowsState = WaterfallRowsState.EXPANDED"
            >
              <AddIcon />
            </KButton>
          </KTooltip>
          <KTooltip
            placement="top"
            :text="t('waterfall.action.collapse_all')"
          >
            <KButton
              appearance="tertiary"
              icon
              size="small"
              @click="rowsState = WaterfallRowsState.COLLAPSED"
            >
              <RemoveIcon />
            </KButton>
          </KTooltip>
        </div>

        <div>
          <WaterfallScale v-if="config" />
        </div>
      </div>
    </div>

    <div
      ref="rowsArea"
      class="waterfall-rows"
      @mouseleave="handleRowsAreaLeave"
      @mousemove="handleRowsAreaMove"
      @wheel="handleWheel"
    >
      <div class="waterfall-row">
        <div />
        <div class="span-bar-wrapper">
          <div ref="spanBarMeasurement" />
        </div>
      </div>

      <div class="guide" />

      <WaterfallSpanRow
        v-if="rootSpan"
        :span-node="rootSpan"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { AddIcon, RemoveIcon } from '@kong/icons'
import { computed, provide, reactive, ref, toRef, useTemplateRef, watch, type PropType, type Ref } from 'vue'
import composables from '../../composables'
import { WATERFALL_ROW_COLUMN_GAP, WATERFALL_ROW_LABEL_WIDTH, WATERFALL_ROW_PADDING_X, WATERFALL_SPAN_BAR_FADING_WIDTH } from '../../constants'
import { WATERFALL_CONFIG, WATERFALL_ROWS_STATE, WaterfallRowsState } from '../../constants/waterfall'
import { type MarkReactiveInputRefs, type SpanNode, type WaterfallConfig } from '../../types'
import WaterfallScale from './WaterfallScale.vue'
import WaterfallSpanRow from './WaterfallSpanRow.vue'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  ticks: {
    type: Number,
    default: 6,
    validator: (value: number) => value > 1 && Number.isInteger(value),
  },
  rootSpan: {
    type: Object as PropType<SpanNode>,
    default: () => undefined,
  },
  showSkeleton: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  'update:selectedSpan': [span?: SpanNode]
}>()

const rootRef = useTemplateRef<HTMLElement>('root')
const rowsAreaRef = useTemplateRef<HTMLElement>('rowsArea')
const spanBarMeasurementRef = useTemplateRef<HTMLElement>('spanBarMeasurement')

const rowsAreaGuideX = ref<number | undefined>(undefined)

const config = reactive<MarkReactiveInputRefs<WaterfallConfig, 'ticks' | 'root' | 'totalDurationNano'>>({
  ticks: toRef(props, 'ticks'),
  root: toRef(props, 'rootSpan'),
  totalDurationNano: computed(() => {
    if (props.rootSpan?.subtreeValues.startTimeUnixNano === undefined || props.rootSpan?.subtreeValues.endTimeUnixNano === undefined) {
      return 0
    }

    return Number(BigInt(props.rootSpan.subtreeValues.endTimeUnixNano) - BigInt(props.rootSpan.subtreeValues.startTimeUnixNano))
  }),
  zoom: 1,
  viewport: { left: 0, right: 0 },
})

const rowsState = ref(WaterfallRowsState.EXPANDED)

// Provide the config and rows state to all children components
provide<WaterfallConfig>(WATERFALL_CONFIG, config)
provide<Ref<WaterfallRowsState>>(WATERFALL_ROWS_STATE, rowsState)

const getRowsAreaRect = () => rowsAreaRef.value?.getBoundingClientRect()
const getSBMRect = () => spanBarMeasurementRef.value?.getBoundingClientRect()

const handleRowsAreaMove = (e: MouseEvent) => {
  const rowsAreaRect = getRowsAreaRect()
  const sbmRect = getSBMRect()

  if (rowsAreaRect && sbmRect && sbmRect.x < e.x && e.x <= sbmRect.x + sbmRect.width) {
    rowsAreaGuideX.value = e.x - (rowsAreaRect.x ?? 0)
  } else {
    rowsAreaGuideX.value = undefined
  }
}

const handleRowsAreaLeave = () => {
  rowsAreaGuideX.value = undefined
}

watch(() => props.rootSpan, (rootSpan) => {
  config.selectedSpan = rootSpan
}, { immediate: true })

watch(() => config.selectedSpan, (span) => {
  emit('update:selectedSpan', span)
}, { immediate: true })

const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  const sbmRect = getSBMRect()
  if (!sbmRect) {
    // in case
    return
  } else if (e.x < sbmRect.x) {
    rootRef.value?.scrollBy(0, e.deltaY)
    return
  }

  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    const viewportShift = e.deltaX / config.zoom / sbmRect.width

    let nextLeft = config.viewport.left + viewportShift
    let nextRight = config.viewport.right - viewportShift

    if (nextLeft < 0) {
      nextRight = Math.max(0, nextRight + nextLeft)
      nextLeft = 0
    } else if (nextRight < 0) {
      nextLeft = Math.max(0, nextLeft + nextRight)
      nextRight = 0
    }

    config.viewport.left = nextLeft
    config.viewport.right = nextRight
  } else {
    const nextZoom = Math.max(1, config.zoom - (e.deltaY / sbmRect.width) * 4)
    const viewportWidth = 1 - config.viewport.left - config.viewport.right
    const nextViewportWidth = 1 / nextZoom
    const viewportWidthDelta = nextViewportWidth - viewportWidth

    const zoomOrigin = (e.x - sbmRect.x) / sbmRect.width

    let nextLeft = config.viewport.left - viewportWidthDelta * zoomOrigin
    let nextRight = config.viewport.right - viewportWidthDelta * (1 - zoomOrigin)

    if (nextLeft < 0 && nextRight < 0) {
      nextLeft = 0
      nextRight = 0
    } else if (nextLeft < 0) {
      nextRight = Math.max(0, nextRight + nextLeft)
      nextLeft = 0
    } else if (nextRight < 0) {
      nextLeft = Math.max(0, nextLeft + nextRight)
      nextRight = 0
    }

    config.viewport.left = nextLeft
    config.viewport.right = nextRight
    config.zoom = 1 / (1 - config.viewport.left - config.viewport.right)
  }
}
</script>

<style lang="scss" scoped>
.waterfall-skeleton {
  padding: $kui-space-20 $kui-space-40;
}

.waterfall {
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;

  :deep(.waterfall-row) {
    box-sizing: border-box;
    column-gap: v-bind(WATERFALL_ROW_COLUMN_GAP);
    display: grid;
    grid-template-columns: v-bind(WATERFALL_ROW_LABEL_WIDTH) auto;
    padding: 0 v-bind(WATERFALL_ROW_PADDING_X);
    width: 100%;

    & > :nth-child(2) {
      padding: 0 v-bind(WATERFALL_SPAN_BAR_FADING_WIDTH);
    }
  }

  .waterfall-sticky-header {
    background-color: $kui-color-background-neutral-weakest;
    border-bottom: 1px solid $kui-color-border-neutral-weaker;
    padding: $kui-space-30 0 $kui-space-20;
    position: sticky;
    top: 0;
    z-index: 1000;
  }

  .waterfall-actions {
    align-items: center;
    display: flex;
    flex-direction: row;
    gap: $kui-space-10;
    justify-content: flex-start;
  }

  .minimap-wrapper {
    height: 4px;

    .minimap {
      background-color: $kui-color-background-neutral-weaker;
      border-radius: $kui-border-radius-20;
      height: 100%;
      overflow: hidden;
      position: relative;
      width: 100%;

      &::after {
        background-color: $kui-color-background-neutral;
        content: '';
        height: 100%;
        left: v-bind('`${config.viewport.left * 100}%`');
        position: absolute;
        top: 0;
        width: calc(100% - v-bind('`${config.viewport.right * 100}%`') - v-bind('`${config.viewport.left * 100}%`'));
        z-index: 10;
      }
    }
  }

  .waterfall-rows {
    cursor: crosshair;
    font-family: $kui-font-family-code;
    overflow: hidden;
    position: relative;

    .span-bar-measurement {
      border: 1px solid red;
      height: 2px;
    }

    .guide {
      border-left: 1px dashed $kui-color-border-neutral-weak;
      display: v-bind('rowsAreaGuideX !== undefined ? "block" : "none"');
      height: 100%;
      left: -1px;
      pointer-events: none;
      position: absolute;
      top: 0;
      transform: v-bind('`translateX(${rowsAreaGuideX}px)`');
      width: 0;
      z-index: 10;
    }
  }
}
</style>
