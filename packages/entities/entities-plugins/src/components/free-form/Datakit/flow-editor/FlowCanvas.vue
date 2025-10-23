<template>
  <div
    ref="flowCanvas"
    class="dk-flow-canvas"
  >
    <VueFlow
      :id="flowId"
      class="flow"
      :class="{ readonly: mode !== 'edit' }"
      :connect-on-click="false"
      :elements-selectable="mode === 'edit'"
      :max-zoom="MAX_ZOOM_LEVEL"
      :min-zoom="MIN_ZOOM_LEVEL"
      :multi-selection-key-code="null"
      :nodes-connectable="mode === 'edit'"
      :nodes-draggable="mode === 'edit'"
      :pan-on-drag="mode === 'preview' ? false : undefined"
      :pan-on-scroll="mode !== 'edit' ? false : undefined"
      :zoom-on-double-click="mode !== 'edit' ? false : undefined"
      :zoom-on-pinch="mode !== 'edit' ? false : undefined"
      :zoom-on-scroll="mode !== 'edit' ? false : undefined"
      @dragover="onDragOver"
      @drop="onDrop"
      @node-click="onNodeClick"
      @nodes-change="emit('nodes-change')"
      @nodes-initialized="emit('initialized')"
    >
      <Background />
      <Controls
        :fit-view-params="fitViewParams"
        position="bottom-left"
        :show-fit-view="false"
        :show-interactive="false"
        :show-zoom="false"
      >
        <KTooltip
          v-for="control in controls"
          :key="control.name"
          placement="right"
          :text="t(`plugins.free-form.datakit.flow_editor.actions.${control.name}`)"
        >
          <ControlButton
            :disabled="control.disabled"
            @click.stop="control.action"
          >
            <component
              :is="control.icon"
              :size="18"
            />
          </ControlButton>
        </KTooltip>
      </Controls>

      <!-- To not use the default node style -->
      <template #node-flow="{ data }">
        <FlowNode
          :data
          :error="invalidConfigNodeIds.has(data.id)"
          :readonly="mode !== 'edit'"
        />
      </template>
      <template #node-group="{ data }">
        <GroupNode
          :active="activeGroupId === data.id"
          :data
        />
      </template>
    </VueFlow>

    <div
      v-if="disableDrop"
      class="dk-flow-mask"
    >
      {{ t('plugins.free-form.datakit.flow_editor.phase_mask_help') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { AddIcon, AutoLayoutIcon, FullscreenIcon, RemoveIcon } from '@kong/icons'
import { KTooltip } from '@kong/kongponents'
import { Background } from '@vue-flow/background'
import { ControlButton, Controls } from '@vue-flow/controls'
import { VueFlow } from '@vue-flow/core'
import { useElementBounding, useEventListener, useTimeoutFn } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

import useI18n from '../../../../composables/useI18n'
import { DK_DATA_TRANSFER_MIME_TYPE } from '../constants'
import { useHotkeys } from './composables/useHotkeys'
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from './constants'
import FlowNode from './node/FlowNode.vue'
import GroupNode from './node/GroupNode.vue'
import { provideFlowStore } from './store/flow'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

import type { NodeMouseEvent } from '@vue-flow/core'
import type { Component } from 'vue'

import type { DragPayload, NodePhase } from '../types'

const { flowId, phase, mode } = defineProps<{
  flowId: string
  phase: NodePhase
  /**
   * Mode of the flow editor
   * - edit: Flow editor page
   * - view: Config detail page
   * - preview: Plugin edit page preview
   */
  mode: 'edit' | 'view' | 'preview'
}>()

const emit = defineEmits<{
  initialized: []
  'nodes-change': [] // Omitting the changes as we don't use them currently
}>()

const flowCanvas = useTemplateRef('flowCanvas')
const flowCanvasRect = useElementBounding(flowCanvas)
const { i18n: { t } } = useI18n()

const {
  vueFlowStore,
  editorStore,
  autoLayout,
  fitViewParams,
  fitView,
  selectNode,
  placeToRight,
  scrollRightToReveal,
  groupDrop,
} = provideFlowStore({
  phase,
  flowId,
  layoutOptions: {
    viewport: {
      width: flowCanvasRect.width,
      height: flowCanvasRect.height,
    },
  },
  readonly: mode !== 'edit',
})

const { addNode, propertiesPanelOpen, invalidConfigNodeIds, selectedNode, duplicateNode, commit: commitHistory } = editorStore
const { project, vueFlowRef, zoomIn, zoomOut, viewport, maxZoom, minZoom } = vueFlowStore
const {
  activeGroupId,
  beginPanelDrag,
  endPanelDrag,
  updateActiveGroup,
  attachNodeToActiveGroup,
} = groupDrop

const disableDrop = ref(false)

function onNodeClick(event: NodeMouseEvent) {
  if (mode !== 'edit') {
    return
  }

  if (event?.node?.type === 'group') {
    selectNode(undefined)
    return
  }

  propertiesPanelOpen.value = true
}

function onDragOver(e: DragEvent) {
  if (mode !== 'edit' || disableDrop.value) return

  e.preventDefault()

  const { top = 0, left = 0 } = vueFlowRef.value?.getBoundingClientRect() || {}

  const projected = project({
    x: e.clientX - left,
    y: e.clientY - top,
  })

  updateActiveGroup(projected)
}

function onDrop(e: DragEvent) {
  if (mode !== 'edit' || disableDrop.value) return

  const data = e.dataTransfer?.getData(DK_DATA_TRANSFER_MIME_TYPE)
  if (!data) return

  e.preventDefault()

  const payload = JSON.parse(data) as DragPayload
  if (payload.action !== 'create-node') return

  // VueFlow has a bug where it fails to take the top/left offset of the flow canvas into account
  // when projecting the coordinates from mouse event to viewport coordinates.
  const { top = 0, left = 0 } = vueFlowRef.value?.getBoundingClientRect() || {}

  const projected = project({
    x: e.clientX - left,
    y: e.clientY - top,
  })

  const { type, anchor } = payload.data
  const newNode = {
    type,
    phase,
    position: {
      x: projected.x - anchor.offsetX,
      y: projected.y - anchor.offsetY,
    },
  }

  const nodeId = addNode(newNode, false)

  if (!nodeId) {
    endPanelDrag()
    return
  }

  attachNodeToActiveGroup(nodeId)
  commitHistory()
  selectNode(nodeId)
  propertiesPanelOpen.value = true
  endPanelDrag()
}

async function onClickAutoLayout() {
  await autoLayout()
  setTimeout(() => fitView(), 0) // Have to use `setTimeout` here
}

type ControlAction = 'zoom_in' | 'zoom_out' | 'fit_view' | 'auto_layout'
type Control = {
  name: ControlAction
  icon: Component
  action: () => void
  disabled?: boolean
}

const controls = computed<Control[]>(() => {
  if (mode === 'preview') return []

  const result: Control[] = [
    { name: 'zoom_in', icon: AddIcon, action: zoomIn, disabled: viewport.value.zoom >= maxZoom.value },
    { name: 'zoom_out', icon: RemoveIcon, action: zoomOut, disabled: viewport.value.zoom <= minZoom.value },
    { name: 'fit_view', icon: FullscreenIcon, action: fitView },
  ]

  if (mode === 'edit') {
    result.push({ name: 'auto_layout', icon: AutoLayoutIcon, action: onClickAutoLayout })
  }

  return result
})

if (mode === 'edit') {
  const resetMask = () => {
    disableDrop.value = false
  }

  useEventListener('dragstart', (e: DragEvent) => {
    const format = e.dataTransfer?.types.find(type => type.startsWith(`${DK_DATA_TRANSFER_MIME_TYPE}/`))
    if (!format) return

    beginPanelDrag()

    if (phase === 'response') {
      const nodeType = format.replace(`${DK_DATA_TRANSFER_MIME_TYPE}/`, '')
      if (nodeType === 'call') {
        disableDrop.value = true
      }
    }
  })

  let restartMaskTimer: (() => void) | undefined
  if (phase === 'response') {
    const { start } = useTimeoutFn(() => {
      disableDrop.value = false
    }, 80)
    restartMaskTimer = start
    useEventListener('dragover', () => {
      restartMaskTimer?.()
    })
  }

  useEventListener('dragend', () => {
    endPanelDrag()
    if (phase === 'response') {
      resetMask()
    }
  })
}

async function duplicate() {
  const node = selectedNode.value
  if (mode !== 'edit' || !node || node.phase !== phase) return

  const nodeId = duplicateNode(node.id, placeToRight(node.id))

  if (!nodeId) return

  await selectNode(nodeId)
  propertiesPanelOpen.value = true
  scrollRightToReveal(nodeId)
}

useHotkeys({
  enabled: computed(() => !!selectedNode.value && mode === 'edit' && selectedNode.value.phase === phase),
  duplicate,
})

defineExpose({ autoLayout, fitView })
</script>

<style lang="scss" scoped>
.dk-flow-canvas {
  background-color: $kui-color-background-neutral-weakest;
  height: 100%;
  position: relative;
  width: 100%;

  .flow {
    :deep(.vue-flow__controls-button) {
      // Ensure it works in both the sandbox and host apps
      box-sizing: content-box;

      svg {
        max-height: unset;
        max-width: unset;
      }
    }

    &:not(.readonly) {
      :deep(.vue-flow__node) {
        &:hover:not(:has(.value-indicator:hover)) .dk-flow-node {
          border-color: $kui-color-border-primary-weak;
        }

        &.selected .dk-flow-node {
          border-color: $kui-color-border-primary;
        }
      }
    }

    &.readonly * {
      cursor: default;
    }

    :deep(.vue-flow__edge) {
      .vue-flow__edge-path {
        stroke-dasharray: 5;
      }
    }

    :deep(.vue-flow__connection) {
      stroke-dasharray: 5;
    }
  }
}

.dk-flow-mask {
  align-items: center;
  background: rgba($color: $kui-color-background, $alpha: 0.75);
  bottom: 0;
  display: flex;
  justify-content: center;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}
</style>
