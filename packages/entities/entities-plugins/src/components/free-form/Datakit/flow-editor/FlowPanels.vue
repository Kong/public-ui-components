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
import { useEditorStore, usePreferences } from '../composables'
import FlowCanvas from './FlowCanvas.vue'

import type { EdgeChange, NodeChange, VueFlowStore } from '@vue-flow/core'

const DEFAULT_SPLIT_RATIO = 0.5
const SNAPPING_PANEL_RATIO = 0.03
const MAX_SNAPPING_PANEL_HEIGHT = 30

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
const { responsePanelCollapsed } = usePreferences()
const { state, configNodeCounts, clearPendingLayout, setPendingFitView, commit, clear, portalSelection } = useEditorStore()

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

watch(portalSelection, (edgeId) => {
  if (!edgeId) return
  requestFlowStore.removeSelectedElements()
  responseFlowStore.removeSelectedElements()
})

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

const snappingHeight = computed(() => Math.max(MAX_SNAPPING_PANEL_HEIGHT, flowPanelsRect.height.value * SNAPPING_PANEL_RATIO))
const requestResizableHeight = computed(() =>
  flowPanelsRect.height.value - requestLabelRect.height.value - resizeHandleRect.height.value - responseLabelRect.height.value,
)
const snappingRatio = computed(() => {
  const availableHeight = requestResizableHeight.value
  if (!availableHeight) return SNAPPING_PANEL_RATIO
  return Math.max(SNAPPING_PANEL_RATIO, snappingHeight.value / availableHeight)
})

const split = ref(DEFAULT_SPLIT_RATIO) // proportion of request panel height
const requestHeight = computed(() => `${split.value * 100}%`)
const responseHeight = computed(() => `${(1 - split.value) * 100}%`)

const isRequestCollapsed = computed(() => split.value <= snappingRatio.value)
const isResponseCollapsed = computed(() => (1 - split.value) <= snappingRatio.value)

function setSplit(value: number, { persist = true }: { persist?: boolean } = {}) {
  const next = Math.min(1, Math.max(0, value))
  split.value = next

  if (persist && mode === 'edit') {
    responsePanelCollapsed.value = isResponseCollapsed.value
  }
}

function setResponseCollapsed(collapsed: boolean, persist = true) {
  setSplit(collapsed ? 1 : DEFAULT_SPLIT_RATIO, { persist })
}

function setRequestCollapsed(persist = true) {
  setSplit(0, { persist })
}

if (mode === 'edit') {
  // Apply initial state once: collapse response if no response nodes, otherwise follow preference in edit mode.
  const collapseByNodes = configNodeCounts.value.response === 0
  const collapseByPreference = responsePanelCollapsed.value
  setResponseCollapsed(collapseByNodes || collapseByPreference, false)
} else {
  watch(() => configNodeCounts.value.response, (count) => {
    setResponseCollapsed(count === 0, false)
  }, { immediate: true })
}

const onRequestLabelClick = () => {
  if (!resizable) return

  if (isRequestCollapsed.value) {
    setResponseCollapsed(false)
  } else {
    setRequestCollapsed()
  }
}

const onResponseLabelClick = () => {
  if (!resizable) return

  setResponseCollapsed(!isResponseCollapsed.value)
}

const { isDragging } = useDraggable(resizeHandle, {
  onMove(position) {
    if (!resizable) return

    const handleCenterToRequestCanvasTop = Math.max(0, position.y - requestCanvasContainerRect.top.value)
    const requestProportion = Math.min(1,
      Math.max(0,
        handleCenterToRequestCanvasTop / requestResizableHeight.value,
      ),
    )
    setSplit(requestProportion, { persist: false })
  },
  onEnd() {
    if (!resizable) return

    if (requestCanvasContainerRect.height.value < snappingHeight.value) {
      setRequestCollapsed()
    } else if (responseCanvasContainerRect.height.value < snappingHeight.value) {
      setResponseCollapsed(true)
    } else {
      setSplit(split.value)
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
    background-color: var(--kui-color-background, $kui-color-background);
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    gap: var(--kui-space-20, $kui-space-20);
    justify-content: flex-start;
    padding: var(--kui-space-20, $kui-space-20) var(--kui-space-40, $kui-space-40);
    position: relative;
    width: 100%;

    .icon {
      transition: transform 150ms ease-out;

      &.collapsed {
        transform: rotate(-90deg);
      }
    }

    .label-content .count {
      color: var(--kui-color-text-neutral-weak, $kui-color-text-neutral-weak);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
    }

    &.resizable {
      cursor: pointer;
    }

    &:not(.resizable) .label-content {
      padding: 0 var(--kui-space-40, $kui-space-40);
    }

    &.request:before, &.response:before {
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      background-color: var(--kui-color-border, $kui-color-border);
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      bottom: calc(-1 * var(--kui-border-width-10, $kui-border-width-10));
      content: '';
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      height: var(--kui-border-width-10, $kui-border-width-10);
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
      transition: all var(--kui-animation-duration-20, $kui-animation-duration-20) ease-out;
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
        background-color: var(--kui-color-border, $kui-color-border);
        content: '';
        display: block;
        height: $height;
        left: 0;
        position: absolute;
        top: calc(50% - math.div($height, 2));
        transform: scaleY(0);
        transition: transform var(--kui-animation-duration-20, $kui-animation-duration-20) ease-out;
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
      background-color: var(--kui-color-border, $kui-color-border);
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
