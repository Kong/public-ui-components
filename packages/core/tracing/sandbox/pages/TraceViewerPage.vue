<template>
  <div
    class="slideout-trigger"
    @click="slideoutVisible = true"
  >
    <div>
      Click anywhere to show the slideout<br>
      Slideout overlay is OFF (not a bug)<br>
      Click the close button to dismiss the slideout (not a bug)<br>
    </div>
  </div>

  <KSlideout
    class="trace-viewer-slideout"
    :close-on-blur="false"
    :has-overlay="false"
    max-width="min(100%, 1020px)"
    :visible="slideoutVisible"
    @close="slideoutVisible = false"
  >
    <template #title>
      <template v-if="skeleton">
        <KSkeletonBox
          height="2"
          width="50"
        />
      </template>
      <template v-else>
        <KBadge appearance="success">
          200
        </KBadge>

        <div class="trace-viewer-title-request-line">
          GET /kong
        </div>
      </template>
    </template>

    <TraceViewer
      :config="config"
      :root-span="spanRoots[0]"
      :skeleton="skeleton"
      :url="url"
    />
  </KSlideout>

  <KCard
    class="controls"
    title="Controls"
  >
    <KInputSwitch
      v-model="skeleton"
      label="Skeleton"
    />
  </KCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildSpanTrees, TraceViewer, type TraceViewerConfig } from '../../src'
import rawSpans from '../fixtures/spans.json'
// import traceBatches from '../fixtures/trace-batches.json'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const spanRoots = computed(() => buildSpanTrees(rawSpans))
// const spanRoots = computed(() => buildSpanTrees(mergeSpansInTraceBatches(traceBatches)))
const skeleton = ref(false)
const slideoutVisible = ref(false)

const config: TraceViewerConfig = {
  buildEntityLink: (request) => {
    const entityQuery = request.plugin ? `${request.plugin}/${request.entityId}` : request.entityId
    return `https://cloud.konghq.tech/us/gateway-manager/${controlPlaneId}/${request.entity}/${entityQuery}`
  },
  getEntityLinkData: async (request) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      id: request.entityId,
      label: `${request.entity} ${request.entityId}`,
    }
  },
}

const path = `/${Array(10).fill(null).map(() => Math.random().toString(36).slice(2)).join('/')}`
const url = `https://example.com${path}`
</script>

<style lang="scss" scoped>
.slideout-trigger {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
  padding: 16px;
}

.trace-viewer-slideout {
  .trace-viewer-title-request-line {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.slideout-container) {
    box-sizing: border-box;

    .slideout-title {
      flex-shrink: 1;
      min-width: 0;
      height: $kui-line-height-50;
    }

    .slideout-content {
      flex-grow: 1;
    }
  }
}
</style>

<style lang="scss" scoped>
.controls {
  z-index: 10000;
  bottom: 16px;
  left: 16px;
  margin-bottom: 16px;
  position: fixed;
  width: auto;
}
</style>
