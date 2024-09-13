<template>
  <div
    class="slideout-trigger"
    @click="slideoutVisible = true"
  >
    <div>
      Click to show the slideout
    </div>
  </div>

  <KSlideout
    class="trace-viewer-slideout"
    max-width="min(100%, 1020px)"
    :visible="slideoutVisible"
    @close="slideoutVisible = false"
  >
    <template #title>
      <KBadge appearance="warning">
        200
      </KBadge>
      GET {{ path }}
    </template>

    <TraceViewer
      :config="config"
      :root-span="spanRoots[0]"
      :url="url"
    />
  </KSlideout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildSpanTrees, TraceViewer, type TraceViewerConfig } from '../../src'
import rawSpans from '../fixtures/spans.json'

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const spanRoots = computed(() => buildSpanTrees(rawSpans))
const slideoutVisible = ref(false)

const config: TraceViewerConfig = {
  buildEntityLink: (entity, entityId, plugin) => {
    const entityQuery = plugin ? `${plugin}/${entityId}` : entityId
    return `https://cloud.konghq.tech/us/gateway-manager/${controlPlaneId}/${entity}/${entityQuery}`
  },
  getEntityLinkData: async (entity, entityId) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      id: entityId,
      label: `${entity} ${entityId}`,
    }
  },
}

const path = `/${Math.random().toString(36).substring(2)}`
const url = `https://example.com${path}`
</script>

<style lang="scss" scoped>
.slideout-trigger {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.trace-viewer-slideout {
  :deep(.slideout-container) {
    box-sizing: border-box;
    .slideout-content {
      flex-grow: 1;
    }
  }
}
</style>
