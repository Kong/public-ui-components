<template>
  <div
    ref="flowPanels"
    class="flow-panels"
  >
    <div
      ref="requestLabel"
      class="label request"
      :class="{ resizable }"
      @click="onRequestLabelClick"
    >
      <ChevronDownIcon
        v-if="resizable"
        class="icon"
        :class="{ collapsed: isRequestCollapsed }"
      />
      <div class="label-content">
        {{ t('plugins.free-form.datakit.flow_editor.canvas_panel.request') }} <span class="count">
          <template v-if="configNodeCounts.request === 1">
            ({{ t('plugins.free-form.datakit.flow_editor.canvas_panel.node_count_singular') }})
          </template>
          <template v-else>
            ({{ t('plugins.free-form.datakit.flow_editor.canvas_panel.node_count_plural', { count: configNodeCounts.request }) }})
          </template>
        </span>
      </div>
    </div>

    <div
      ref="requestCanvasContainer"
      class="canvas"
      :class="{ dragging: isDragging }"
      :style="{ flexBasis: requestHeight }"
    >
      <FlowCanvas
        ref="requestFlow"
        :flow-id="requestFlowId"
        :mode="mode"
        phase="request"
        @initialized="requestInitialized = true"
        @nodes-change="requestInitialized = false"
      />
    </div>

    <div
      ref="resizeHandle"
      class="resize-handle"
      :class="{ resizable }"
    />

    <div
      ref="responseLabel"
      class="label response"
      :class="{ dragging: isDragging, resizable }"
      @click="onResponseLabelClick"
    >
      <ChevronDownIcon
        v-if="resizable"
        class="icon"
        :class="{ collapsed: isResponseCollapsed }"
      />
      <div class="label-content">
        {{ t('plugins.free-form.datakit.flow_editor.canvas_panel.response') }} <span class="count">
          <template v-if="configNodeCounts.response === 1">
            ({{ t('plugins.free-form.datakit.flow_editor.canvas_panel.node_count_singular') }})
          </template>
          <template v-else>
            ({{ t('plugins.free-form.datakit.flow_editor.canvas_panel.node_count_plural', { count: configNodeCounts.response }) }})
          </template>
        </span>
      </div>
    </div>

    <div
      ref="responseCanvasContainer"
      class="canvas response"
      :class="{ dragging: isDragging }"
      :style="{ flexBasis: responseHeight }"
    >
      <FlowCanvas
        ref="responseFlow"
        :flow-id="responseFlowId"
        :mode="mode"
        phase="response"
        @initialized="responseInitialized = true"
        @nodes-change="responseInitialized = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { ChevronDownIcon } from '@kong/icons'
import { useVueFlow } from '@vue-flow/core'
import { useDraggable, useElementBounding } from '@vueuse/core'
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'

import english from '../../../../locales/en.json'
import { useEditorStore } from '../composables'
import FlowCanvas from './FlowCanvas.vue'

import type { EdgeChange, NodeChange, VueFlowStore } from '@vue-flow/core'

const { inactive, mode, resizable } = defineProps<{
  /**
   * Whether current component is inactive (e.g. covered by modal).
   */
  inactive?: boolean
  /**
   * Mode of the flow editor
   * - edit: Flow editor page
   * - view: Config detail page
   * - preview: Plugin edit page preview
   */
  mode: 'edit' | 'view' | 'preview'
  resizable?: boolean
}>()

const { t } = createI18n<typeof english>('en-us', english)

const requestInitialized = ref(false)
const responseInitialized = ref(false)
const { state, configNodeCounts, clearPendingLayout, setPendingFitView, commit, clear } = useEditorStore()

const uniqueId = useId()
const requestFlowId = `${uniqueId}-request`
const responseFlowId = `${uniqueId}-response`

const requestFlowStore = useVueFlow(requestFlowId)
const responseFlowStore = useVueFlow(responseFlowId)

function syncSelectionState(active: VueFlowStore, other: VueFlowStore) {
  const { onPaneClick, onNodesChange, onEdgesChange, getSelectedNodes, getSelectedEdges } = active
  const { removeSelectedElements } = other

  function handleSelectionChange(changes?: NodeChange[] | EdgeChange[]) {
    if (!changes) {
      removeSelectedElements()
      return
    }

    if (!changes.some((change) => change.type === 'select')) return

    if (getSelectedNodes.value.length + getSelectedEdges.value.length > 0) {
      removeSelectedElements()
    }
  }

  onNodesChange(handleSelectionChange)
  onEdgesChange(handleSelectionChange)
  onPaneClick(() => handleSelectionChange())
}
syncSelectionState(requestFlowStore, responseFlowStore)
syncSelectionState(responseFlowStore, requestFlowStore)

const flowPanels = useTemplateRef('flowPanels')
const requestLabel = useTemplateRef('requestLabel')
const requestCanvasContainer = useTemplateRef('requestCanvasContainer')
const requestFlow = useTemplateRef('requestFlow')
const resizeHandle = useTemplateRef('resizeHandle')
const responseLabel = useTemplateRef('responseLabel')
const responseCanvasContainer = useTemplateRef('responseCanvasContainer')
const responseFlow = useTemplateRef('responseFlow')

const flowPanelsRect = useElementBounding(flowPanels)
const requestLabelRect = useElementBounding(requestLabel)
const requestCanvasContainerRect = useElementBounding(requestCanvasContainer)
const resizeHandleRect = useElementBounding(resizeHandle)
const responseLabelRect = useElementBounding(responseLabel)
const responseCanvasContainerRect = useElementBounding(responseCanvasContainer)

const snappingHeight = computed(() => Math.max(30, flowPanelsRect.height.value * 0.03))
const isRequestCollapsed = computed(() => requestCanvasContainerRect.height.value < snappingHeight.value)
const isResponseCollapsed = computed(() => responseCanvasContainerRect.height.value < snappingHeight.value)

const requestHeight = ref('50%')
const responseHeight = ref('50%')

const onRequestLabelClick = () => {
  if (!resizable) return

  if (isRequestCollapsed.value) {
    requestHeight.value = '50%'
    responseHeight.value = '50%'
  } else {
    requestHeight.value = '0'
    responseHeight.value = '100%'
  }
}

const onResponseLabelClick = () => {
  if (!resizable) return

  if (isResponseCollapsed.value) {
    requestHeight.value = '50%'
    responseHeight.value = '50%'
  } else {
    requestHeight.value = '100%'
    responseHeight.value = '0'
  }
}

const requestResizableHeight = computed(() =>
  flowPanelsRect.height.value - requestLabelRect.height.value - resizeHandleRect.height.value - responseLabelRect.height.value,
)

const { isDragging } = useDraggable(resizeHandle, {
  onMove(position) {
    if (!resizable) return

    const handleCenterToRequestCanvasTop = Math.max(0, position.y - requestCanvasContainerRect.top.value)
    const requestProportion = Math.min(1,
      Math.max(0,
        handleCenterToRequestCanvasTop / requestResizableHeight.value,
      ),
    )
    requestHeight.value = `${requestProportion * 100}%`
    responseHeight.value = `${(1 - requestProportion) * 100}%`
  },
  onEnd() {
    if (!resizable) return

    if (requestCanvasContainerRect.height.value < snappingHeight.value) {
      requestHeight.value = '0'
      responseHeight.value = '100%'
    } else if (responseCanvasContainerRect.height.value < snappingHeight.value) {
      requestHeight.value = '100%'
      responseHeight.value = '0'
    }
  },
})

function fitView() {
  nextTick(() => {
    requestFlow.value?.fitView()
    responseFlow.value?.fitView()
  })
}

watch(
  [requestInitialized, responseInitialized, () => state.value.pendingLayout, () => state.value.pendingFitView],
  ([requestReady, responseReady, pendingLayout, pendingFitView]) => {
    // If current component is inactive (e.g. covered by modal), do nothing
    // Note: `inactive` does not trigger this watcher. Update this BEFORE updating sources that trigger this watcher.
    if (inactive) return

    // Not ready
    if (!requestReady || !responseReady)
      return

    // Nothing to do here
    if (!pendingLayout && !pendingFitView)
      return

    // Clear the pending states to avoid reentrance
    if (pendingLayout)
      clearPendingLayout()

    if (pendingFitView)
      setPendingFitView(false)

    // Wait for VueFlow internal layout measurements. nextTick does not work here.
    setTimeout(async () => {
      if (pendingLayout) {
        await requestFlow.value?.autoLayout(false)
        await responseFlow.value?.autoLayout(false)
        commit('*')

        if (pendingLayout === 'clearHistory')
          clear()
      }

      if (pendingFitView) {
        setTimeout(() => fitView(), 0) // Have to use `setTimeout` here
      }
    }, 0)
  },
)
</script>

<style lang="scss" scoped>
@use 'sass:math';

.flow-panels {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  .label {
    align-items: center;
    background-color: $kui-color-background;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    font-weight: $kui-font-weight-semibold;
    gap: $kui-space-20;
    justify-content: flex-start;
    padding: $kui-space-20 $kui-space-40;
    position: relative;
    width: 100%;

    .icon {
      transition: transform 150ms ease-out;

      &.collapsed {
        transform: rotate(-90deg);
      }
    }

    .label-content .count {
      color: $kui-color-text-neutral-weak;
      font-weight: $kui-font-weight-regular;
    }

    &.resizable {
      cursor: pointer;
    }

    &:not(.resizable) .label-content {
      padding: 0 $kui-space-40;
    }

    &.request:before, &.response:before {
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      background-color: $kui-color-border;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      bottom: -$kui-border-width-10;
      content: '';
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      height: $kui-border-width-10;
      left: 0;
      position: absolute;
      width: 100%;
      z-index: 10;
    }
  }

  .canvas {
    flex-basis: 50%;
    width: 100%;

    &:not(.dragging) {
      transition: all $kui-animation-duration-20 ease-out;
    }
  }

  .resize-handle {
    $interactive-height: 5px;
    $visual-height: 1px;
    flex-shrink: 0;
    height: $interactive-height;
    margin-bottom: math.div(-($interactive-height - $visual-height), 2);
    margin-top: math.div(-($interactive-height - $visual-height), 2);
    position: relative;
    user-select: none;
    width: 100%;

    &.resizable {
      cursor: row-resize;

      &:after {
        $height: 5px;
        /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
        background-color: $kui-color-border;
        content: '';
        display: block;
        height: $height;
        left: 0;
        position: absolute;
        top: calc(50% - math.div($height, 2));
        transform: scaleY(0);
        transition: transform $kui-animation-duration-20 ease-out;
        width: 100%;
        z-index: 100;
      }

      &:hover:after {
        transform: scaleY(1);
      }
    }

    &:before {
      $height: 1px;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      background-color: $kui-color-border;
      content: '';
      display: block;
      height: $height;
      left: 0;
      position: absolute;
      top: calc(50% - math.div($height, 2));
      width: 100%;
      z-index: 90;
    }
  }
}
</style>
