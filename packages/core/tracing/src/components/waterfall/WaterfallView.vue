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
    class="waterfall"
  >
    <div class="waterfall-sticky-header">
      <!-- RESERVED: ZOOMING
      <div class="waterfall-row">
        <div class="minimap-wrapper">
          <div
            v-if="interaction === 'zoom'"
            class="minimap"
          />
        </div>
      </div>
      -->

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
// RESERVED: Only used when zooming is enabled
// import { useWheel } from '@vueuse/gesture'
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
  'update:selectedSpan': [span?: SpanNode];
}>()

const rowsAreaRef = useTemplateRef<HTMLElement>('rowsArea')
const spanBarMeasurementRef = useTemplateRef<HTMLElement>('spanBarMeasurement')

// Locked to 'scroll' for now
const interaction = ref<'scroll' | 'zoom'>('scroll')
const rowsAreaGuideX = ref<number | undefined>(undefined)

const config = reactive<MarkReactiveInputRefs<WaterfallConfig, 'ticks' | 'totalDurationNano' | 'startTimeUnixNano'>>({
  ticks: toRef(props, 'ticks'), // This will be unwrapped
  totalDurationNano: computed(() => props.rootSpan?.durationNano ?? 0), // This will be unwrapped
  startTimeUnixNano: computed(() => props.rootSpan ? BigInt(props.rootSpan.span.startTimeUnixNano) : 0n), // This will be unwrapped
  zoom: 1,
  viewportShift: 0,
  viewport: { left: 0, right: 0 },
})

const rowsState = ref(WaterfallRowsState.EXPANDED)

// Provide the config and rows state to all children components
provide<WaterfallConfig>(WATERFALL_CONFIG, config)
provide<Ref<WaterfallRowsState>>(WATERFALL_ROWS_STATE, rowsState)

const getRowsAreaRect = () => rowsAreaRef.value?.getBoundingClientRect()
const getSBMRect = () => spanBarMeasurementRef.value?.getBoundingClientRect()

const handleRowsAreaMove = (e: MouseEvent) => {
  const rowsAreaRect = getRowsAreaRect()!
  const sbmRect = getSBMRect()!
  if (sbmRect.x < e.x && e.x <= sbmRect.x + sbmRect.width) {
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

// RESERVED: Only used when zooming is enabled
// watch(interaction, () => {
//   config.viewport = { left: 0, right: 0 }
//   config.zoom = 1
//   config.viewportShift = 0
// })

// RESERVED: Only used when zooming is enabled
// useWheel(
//   (e) => {
//     if (interaction.value !== 'zoom') {
//       return
//     }

//     e.event.preventDefault()

//     const sbmRect = getSBMRect()!
//     if (e.event.x < sbmRect.x) {
//       return
//     }

//     if (Math.abs(e.delta[0]) > Math.abs(e.delta[1])) {
//       const viewportShift = e.delta[0] / config.zoom / sbmRect.width
//       config.viewport.left += viewportShift
//       config.viewport.right -= viewportShift
//       if (config.viewport.left < 0) {
//         config.viewport.right += config.viewport.left
//         config.viewport.left = 0
//       } else if (config.viewport.right < 0) {
//         config.viewport.left += config.viewport.right
//         config.viewport.right = 0
//       }
//     } else {
//       const nextZoom = Math.max(1, config.zoom - (e.delta[1] / sbmRect.width) * 4)
//       const viewportWidth = 1 - config.viewport.left - config.viewport.right
//       const nextViewportWidth = 1 / nextZoom
//       const viewportWidthDelta = nextViewportWidth - viewportWidth

//       const zoomOrigin = (e.event.x - sbmRect.x) / sbmRect.width

//       config.viewport.left = config.viewport.left - viewportWidthDelta * zoomOrigin
//       config.viewport.right = config.viewport.right - viewportWidthDelta * (1 - zoomOrigin)

//       if (config.viewport.left < 0 && config.viewport.right < 0) {
//         config.viewport.left = 0
//         config.viewport.right = 0
//       } else if (config.viewport.left < 0) {
//         config.viewport.right += config.viewport.left
//         config.viewport.left = 0
//         if (config.viewport.right < 0) {
//           config.viewport.right = 0
//         }
//       } else if (config.viewport.right < 0) {
//         config.viewport.left += config.viewport.right
//         config.viewport.right = 0
//         if (config.viewport.left < 0) {
//           config.viewport.left = 0
//         }
//       }

//       config.zoom = 1 / (1 - config.viewport.left - config.viewport.right)
//     }
//   },
//   {
//     domTarget: rowsAreaRef,
//     eventOptions: {
//       passive: false,
//     },
//   },
// )

// RESERVED: Only used when zooming is enabled
// watchEffect(() => {
//   const sbmRect = getSBMRect()
//   if (sbmRect) {
//     const minViewportShift = -(sbmRect.width * config.zoom) + sbmRect.width

//     if (config.viewportShift > 0) {
//       config.viewportShift = 0
//     } else if (config.viewportShift < minViewportShift) {
//       config.viewportShift = minViewportShift
//     }
//   }
// })
</script>

<style lang="scss" scoped>
.waterfall-skeleton {
  padding: $kui-space-20 $kui-space-40;
}

.waterfall {
  box-sizing: border-box;
  height: 100%;
  overflow-y: v-bind('interaction === "zoom" ? "hidden" : "scroll"');

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

  .waterfall-minimap {
    align-items: center;

    .minimap-label {
      font-size: $kui-font-size-20;
      grid-column: 1 / 2;
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
          left: v-bind('`${config.viewport.left * 100}%`'); // RESERVED: Only used when zooming is enabled
          position: absolute;
          top: 0;
          width: calc(100% - v-bind('`${config.viewport.right * 100}%`') - v-bind('`${config.viewport.left * 100}%`')); // RESERVED: Only used when zooming is enabled
          z-index: 10;
        }
      }
    }
  }

  .waterfall-rows {
    cursor: v-bind('rowsAreaGuideX !== undefined ? "crosshair" : "crosshair"');
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
