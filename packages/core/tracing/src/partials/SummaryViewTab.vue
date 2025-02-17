<template>
  <Splitpanes
    class="summary-view"
    horizontal
  >
    <Pane
      class="lifecycle-pane"
      min-size="20"
    >
      <div class="lifecycle-view-wrapper">
        <LifecycleView
          v-if="rootSpan"
          :root-span="rootSpan"
          :show-skeleton="showSkeleton"
        />
      </div>
    </Pane>
    <Pane
      class="detail-pane"
      size="50"
    >
      <template v-if="rootSpan">
        <RequestInfo
          :root-span="rootSpan"
          :show-skeleton="showSkeleton"
        />

        <PayloadDisplay
          v-if="payloads?.headers?.request"
          :payload="{ direction: 'request', type: 'headers', headers: payloads.headers.request }"
          :show-skeleton="showSkeleton"
          :title="t('payload.request_headers')"
        />

        <PayloadDisplay
          v-if="payloads?.body?.request"
          :payload="{ direction: 'request', type: 'body', content: payloads.body.request }"
          :show-skeleton="showSkeleton"
          :title="t('payload.request_body')"
        />

        <PayloadDisplay
          v-if="payloads?.headers?.response"
          :payload="{ direction: 'response', type: 'headers', headers: payloads.headers.response }"
          :show-skeleton="showSkeleton"
          :title="t('payload.response_headers')"
        />

        <PayloadDisplay
          v-if="payloads?.body?.response"
          :payload="{ direction: 'response', type: 'body', content: payloads.body.response }"
          :show-skeleton="showSkeleton"
          :title="t('payload.response_body')"
        />
      </template>
    </Pane>
  </Splitpanes>
</template>

<script setup lang="ts">
import { Pane, Splitpanes } from '@kong/splitpanes'
import LifecycleView from '../components/lifecycle/LifecycleView.vue'
import PayloadDisplay from '../components/payload/PayloadDisplay.vue'
import RequestInfo from '../components/payload/RequestInfo.vue'
import composables from '../composables'
import type { Body, Headers, SpanNode } from '../types'

import '@kong/splitpanes/dist/splitpanes.css'

const { i18n: { t } } = composables.useI18n()

defineProps<{
  rootSpan?: SpanNode
  payloads?: {
    headers?: {
      request: Headers
      response: Headers
    }
    body?: {
      request: Body
      response: Body
    }
  }
  showSkeleton?: boolean
}>()
</script>

<style lang="scss" scoped>
@use 'sass:math';

.summary-view {
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

  .lifecycle-pane {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
    padding: $kui-space-70 0;
  }

  .lifecycle-view-wrapper {
    border: 1px solid $kui-color-border;
    border-radius: $kui-border-radius-20;
    height: 100%;
    overflow: hidden;
  }

  .detail-pane {
    box-sizing: border-box;
    overflow-y: scroll;
  }
}
</style>
