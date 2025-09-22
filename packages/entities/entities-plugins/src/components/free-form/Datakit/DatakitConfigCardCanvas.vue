<template>
  <div class="datakit-config-card-canvas">
    <div
      class="config-card-details-label"
      data-testid="datakit-configuration-label"
    >
      <KLabel>
        <span class="label-content">
          Nodes
        </span>
      </KLabel>
    </div>

    <div
      class="config-card-details-value datakit-canvas-container"
      data-testid="datakit-configuration-canvas"
    >
      <div
        class="canvas-wrapper"
      >
        <FlowPanels
          class="datakit-flow-panels"
          mode="view"
          resizable
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DatakitConfig, DatakitUIData } from './types'
import FlowPanels from './flow-editor/FlowPanels.vue'
import { provideEditorStore } from './composables'

const { nodes, uidata } = defineProps<{
  nodes: DatakitConfig['nodes']
  uidata?: DatakitUIData
}>()

provideEditorStore(nodes ?? [], uidata?.nodes ?? [])
</script>

<style lang="scss" scoped>
.datakit-config-card-canvas {
  align-items: flex-start;
  border-bottom: solid $kui-border-width-10 $kui-color-border;
  box-sizing: border-box;
  display: flex;
  padding: $kui-space-60;
  padding-left: 0;
  width: 100%;

  .config-card-details-label {
    box-sizing: border-box;
    padding-right: $kui-space-60;
    width: 25%;

    label {
      color: $kui-color-text-neutral-stronger;
      display: inline-flex;
      max-width: 100%;

      .label-content {
        line-height: initial;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .k-popover {
        min-width: 0;
      }
    }
  }

  .config-card-details-value {
    box-sizing: border-box;
    width: 75%;

    &.datakit-canvas-container {
      .canvas-wrapper {
        position: relative;

        .datakit-flow-panels {
          border: solid $kui-border-width-10 $kui-color-border;
          border-radius: $kui-border-radius-20;
          height: 560px;
          overflow: hidden;
          width: 100%;
        }

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        :deep(.vue-flow__controls-button) {
          // Ensure it works in both the sandbox and host apps
          box-sizing: content-box;

          svg {
            max-height: unset;
            max-width: unset;
          }
        }
      }
    }
  }

  :deep(.k-label) {
    margin-bottom: 0;
  }
}
</style>
