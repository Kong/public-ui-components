<template>
  <Splitpanes
    class="trace-view"
    horizontal
  >
    <Pane
      class="summary-pane"
      min-size="20"
    >
      <div class="above-waterfall">
        <template v-if="showSkeleton">
          <KSkeletonBox
            height="2"
            width="25"
          />
          <KSkeletonBox
            height="2"
            width="25"
          />
        </template>
        <template v-else-if="rootSpan">
          <TraceLatency :span="rootSpan.span" />

          <div
            v-if="url"
            class="url"
          >
            <div class="label">
              {{ t('trace_viewer.url') }}
            </div>
            <div class="content">
              <KCopy
                copy-tooltip="Copy"
                :text="url"
                truncate
                truncation-limit="auto"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="waterfall-wrapper">
        <WaterfallView
          :root-span="props.rootSpan"
          :show-skeleton="props.showSkeleton"
          @update:selected-span="handleUpdateSelectedSpan"
        />
      </div>
    </Pane>

    <Pane
      class="detail-pane"
      size="50"
    >
      <KSkeleton
        v-if="showSkeleton"
        :table-columns="2"
        :table-rows="8"
        type="table"
      />
      <div
        v-else-if="selectedSpan"
        class="span-details"
      >
        <SpanBasicInfo
          v-if="selectedSpan && spanDescription"
          :description="spanDescription"
          :name="selectedSpan.span.name"
        />

        <KAlert
          v-if="spanMaybeIncomplete(selectedSpan)"
          appearance="danger"
          :message="t('trace_viewer.incomplete_span_warning.message')"
          show-icon
          :style="{ width: '100%' }"
          :title="t('trace_viewer.incomplete_span_warning.title')"
        >
          <template #icon>
            <!-- TODO: Waiting for https://github.com/Kong/kongponents/pull/2550 to be adopted -->
            <DangerIcon />
          </template>
        </KAlert>

        <SpanEventList
          v-if="selectedSpan.span.events && selectedSpan.span.events.length > 0"
          :span="selectedSpan.span"
        />

        <SpanLatencyTable
          :span="selectedSpan.span"
        />

        <SpanAttributeTable
          :span="selectedSpan.span"
        />
      </div>
      <div
        v-else
        class="empty-state"
      >
        <template v-if="selectedSpan">
          {{ t('trace_viewer.empty_state.nothing_to_display') }}
        </template>
        <template v-else>
          {{ t('trace_viewer.empty_state.unselected') }}
        </template>
      </div>
    </Pane>
  </Splitpanes>
</template>

<script setup lang="ts">
import { DangerIcon } from '@kong/icons'
import { Pane, Splitpanes } from '@kong/splitpanes'
import { computed, provide, reactive, shallowRef } from 'vue'
import SpanAttributeTable from '../components/trace/SpanAttributeTable.vue'
import SpanBasicInfo from '../components/trace/SpanBasicInfo.vue'
import SpanEventList from '../components/trace/SpanEventList.vue'
import SpanLatencyTable from '../components/trace/SpanLatencyTable.vue'
import TraceLatency from '../components/trace/TraceLatency.vue'
import WaterfallView from '../components/waterfall/WaterfallView.vue'
import composables from '../composables'
import { TRACE_VIEWER_CONFIG, WATERFALL_ROW_COLUMN_GAP, WATERFALL_ROW_LABEL_WIDTH, WATERFALL_ROW_PADDING_X, WATERFALL_SPAN_BAR_FADING_WIDTH } from '../constants'
import type { SpanNode, TraceViewerConfig } from '../types'
import { getPhaseAndPlugin, spanMaybeIncomplete } from '../utils'

import '@kong/splitpanes/dist/splitpanes.css'

const { i18n: { t, te } } = composables.useI18n()

const props = defineProps<{
  config: TraceViewerConfig
  rootSpan?: SpanNode
  url?: string
  showSkeleton?: boolean
}>()

// Provide the config to all children components
provide<TraceViewerConfig>(TRACE_VIEWER_CONFIG, reactive(props.config))

const selectedSpan = shallowRef<SpanNode | undefined>(undefined)

const spanDescription = computed(() => {
  const span = selectedSpan.value?.span
  if (!span) {
    return false
  }

  const pluginSpan = getPhaseAndPlugin(span.name)
  // We will use general description for plugin spans that exactly match `kong.(phase).plugin.(plugin)`.
  const subI18nKey = pluginSpan && !pluginSpan.suffix ? `kong.${pluginSpan.phase}.plugin` : span.name
  const i18nKey = `trace_viewer.span_basic_info.descriptions.${subI18nKey}.$`
  return te(i18nKey as any) ? t(i18nKey as any) : undefined
})

const handleUpdateSelectedSpan = (span?: SpanNode) => {
  selectedSpan.value = span
}
</script>

<style lang="scss" scoped>
@use 'sass:math';

.trace-view {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 0 !important;
  position: relative;
  width: 100%;

  :deep(.splitpanes__pane) {
    transition: none;
  }

  :deep(.splitpanes__splitter) {
    $resize-handle-height: 4px;
    $splitter-border-width: 1px;
    $splitter-border-width-hovered: 2px;
    align-items: center;
    border-top: $splitter-border-width solid $kui-color-border-neutral-weaker;
    display: flex;
    flex-direction: row;
    justify-content: center;
    padding: $kui-space-20 0;
    position: relative;
    width: 100%;

    &::before {
      background-color: $kui-color-background-neutral-weaker;
      content: '';
      height: $splitter-border-width-hovered;
      position: absolute;
      top: -($splitter-border-width-hovered + math.div($splitter-border-width-hovered - $splitter-border-width, 2));
      transform: scaleY(0);
      transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
      width: 100%;
    }

    &::after {
      background-color: $kui-color-background-neutral-weaker;
      border-radius: math.div($resize-handle-height, 2);
      content: '';
      height: $resize-handle-height;
      transition: background-color 0.2s ease-in-out;
      width: 30px;
    }

    &:hover {
      &::before,
      &::after {
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
    padding: $kui-space-50 0 $kui-space-70;

    .above-waterfall {
      align-items: center;
      display: flex;
      flex-direction: row;
      flex-shrink: 0;
      gap: $kui-space-50;
      height: 20px; // $kui-line-height-30
      justify-content: space-between;
      line-height: $kui-line-height-30;

      .url {
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: $kui-space-40;
        justify-content: flex-end;
        max-width: 30%;

        .label {
          font-size: $kui-font-size-30;
          font-weight: $kui-font-weight-semibold;
        }

        .content {
          flex-shrink: 1;
          min-width: 0;

          :deep(.popover-content) {
            word-break: break-all;
          }
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
    overflow-y: scroll;

    .span-details {
      display: flex;
      flex-direction: column;
      gap: $kui-space-60;
      margin: $kui-space-20 0;
    }

    .empty-state {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: center;
      width: 100%;
    }

    :deep(.config-card-details-row) {
      column-gap: v-bind(WATERFALL_ROW_COLUMN_GAP);
      display: grid;
      grid-template-columns: v-bind(WATERFALL_ROW_LABEL_WIDTH) auto;
      padding: $kui-space-60 v-bind(WATERFALL_ROW_PADDING_X);

      .config-card-details-label {
        width: 100%;
      }

      .config-card-details-value {
        padding: 0 v-bind(WATERFALL_SPAN_BAR_FADING_WIDTH);
        width: 100%;
      }
    }
  }
}
</style>
