<template>
  <Splitpanes
    class="trace-viewer"
    horizontal
  >
    <Pane
      class="summary-pane"
      min-size="20"
    >
      <div class="above-waterfall">
        <WaterfallLegend />

        <div class="url">
          <div class="label">
            {{ t('trace_viewer.url') }}
          </div>
          <div class="content">
            <KCopy
              copy-tooltip="Copy"
              :text="url"
            />
          </div>
        </div>
      </div>

      <div class="waterfall-wrapper">
        <WaterfallView
          :root-span="props.rootSpan"
          @update:selected-span="handleUpdateSelectedSpan"
        />
      </div>
    </Pane>

    <Pane
      class="detail-pane"
      size="50"
    >
      <div v-if="selectedSpan && !spanNothingToDisplay">
        <SpanEventList
          v-if="selectedSpan.span.events && selectedSpan.span.events.length > 0"
          :span="selectedSpan.span"
        />
        <SpanAttributeTable
          v-if="selectedSpan.span.attributes.length > 0"
          :span="selectedSpan.span"
        />
      </div>
      <div
        v-else
        class="empty-state"
      >
        <template v-if="!selectedSpan">
          {{ t('trace_viewer.empty_state.unselected') }}
        </template>
        <template v-else>
          {{ t('trace_viewer.empty_state.nothing_to_display') }}
        </template>
      </div>
    </Pane>
  </Splitpanes>
</template>

<script setup lang="tsx">
import { Pane, Splitpanes } from '@kong/splitpanes'
import { computed, provide, reactive, ref, type PropType } from 'vue'
import composables from '../../composables'
import { TRACE_VIEWER_CONFIG } from '../../constants'
import type { SpanNode, TraceViewerConfig } from '../../types'
import WaterfallLegend from '../waterfall/WaterfallLegend.vue'
import WaterfallView from '../waterfall/WaterfallView.vue'
import SpanAttributeTable from './SpanAttributeTable.vue'
import SpanEventList from './SpanEventList.vue'

import '@kong/splitpanes/dist/splitpanes.css'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  config: {
    type: Object as PropType<TraceViewerConfig>,
    required: true,
  },
  rootSpan: {
    type: Object as PropType<SpanNode>,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
})

// Provide the config to all children components
provide<TraceViewerConfig | undefined>(TRACE_VIEWER_CONFIG, reactive(props.config))

const selectedSpan = ref<SpanNode | undefined>(undefined)

const handleUpdateSelectedSpan = (span?: SpanNode) => {
  selectedSpan.value = span
}

const spanNothingToDisplay = computed(() => {
  if (!selectedSpan.value) {
    return true
  }

  if (selectedSpan.value.span.events && selectedSpan.value.span.events.length > 0) {
    return false
  }

  if (selectedSpan.value.span.attributes.length > 0) {
    return false
  }

  return true
})
</script>

<style lang="scss" scoped>
.trace-viewer {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 0 !important;
  position: relative;
  width: 100%;

  :deep(.splitpanes__splitter) {
    $resize-handle-height: 4px;
    align-items: center;
    border-top: 1px solid $kui-color-border-neutral-weaker;
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding: $kui-space-20 0;
    position: relative;
    width: 100%;

    &::before {
      background-color: $kui-color-background-neutral-weaker;
      content: '';
      height: 2px;
      position: absolute;
      top: -1.5px;
      transform: scaleY(0);
      transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
      width: 100%;
    }

    &::after {
      background-color: $kui-color-background-neutral-weaker;
      border-radius: $resize-handle-height / 2;
      content: '';
      height: $resize-handle-height;
      transition: background-color 0.2s ease-in-out;
      width: 30px;
    }

    &:hover {
      &::before, &::after {
        background-color: $kui-color-background-neutral-weak;
      }
      &::before {
        transform: scaleY(1);
      }
    }
  }

  .summary-pane {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
    padding: $kui-space-30 0 $kui-space-70;

    .above-waterfall {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-50;
      justify-content: space-between;

      .url {
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: $kui-space-40;
        justify-content: flex-end;
        min-width: 30%;

        .label {
          font-size: $kui-font-size-30;
          font-weight: $kui-font-weight-semibold;
        }
      }
    }

    .waterfall-wrapper {
      border: 1px solid $kui-color-border-neutral-weaker;
      border-radius: $kui-border-radius-20;
      height: 100%;
      overflow: hidden;
    }
  }

  .detail-pane {
    box-sizing: border-box;
    overflow: scroll;
    padding-bottom: $kui-space-120;

    .empty-state {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: center;
      width: 100%;
    }
  }
}
</style>
