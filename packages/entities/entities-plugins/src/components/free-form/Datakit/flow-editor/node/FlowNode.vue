<template>
  <div
    class="flow-node"
    :class="{
      reversed: isReversed,
      implicit: isImplicit,
      readonly,
    }"
    @mousedown="closeMenu"
  >
    <div class="body">
      <KTooltip
        v-if="!isImplicit"
        class="badge"
        placement="top"
        :text="data.type"
      >
        <NodeBadge
          icon-only
          size="small"
          :type="data.type"
        />
      </KTooltip>
      <div class="name">
        {{ name }}
      </div>
      <WarningIcon
        v-if="error"
        class="error-icon"
        :color="KUI_COLOR_TEXT_DANGER"
        :size="16"
      />
      <KDropdown
        v-if="!isImplicit"
        ref="menu"
        class="menu"
        :disabled="readonly"
        :kpop-attributes="{
          offset: '4px',
          target: 'body',
          popoverClasses: 'dk-flow-node-menu',
        }"
        width="160"
        @click.stop
      >
        <KButton
          appearance="tertiary"
          class="menu-trigger"
          icon
          size="small"
        >
          <MoreIcon :color="KUI_COLOR_TEXT" />
        </KButton>
        <template #items>
          <KDropdownItem
            @click="duplicate"
          >
            <HotkeyLabel
              :keys="HOTKEYS.duplicate"
              :label="t('plugins.free-form.datakit.flow_editor.actions.duplicate')"
            />
          </KDropdownItem>
          <KDropdownItem
            danger
            @click="removeNode(data.id)"
          >
            <HotkeyLabel
              :keys="HOTKEYS.delete"
              :label="t('plugins.free-form.datakit.flow_editor.actions.delete')"
            />
          </KDropdownItem>
        </template>
      </KDropdown>
    </div>

    <div
      class="handles"
      :class="{ reversed: isReversed }"
    >
      <div
        v-if="showInputHandles"
        class="input-handles"
        :class="{ 'has-fields': hasInputFields }"
      >
        <div class="handle">
          <Handle
            id="input"
            :position="inputPosition"
            type="target"
          />

          <!-- ValueIndicator of input -->
          <ValueIndicator
            v-if="getSpecialConnection('input')"
            :edge-id="getSpecialConnection('input')!.edgeId"
            mode="input"
            :reversed="isReversed"
            :source-field-name="getSpecialConnection('input')!.sourceFieldName"
            :source-node="getSpecialConnection('input')!.sourceNode"
          />

          <div class="handle-label-wrapper">
            <div
              class="handle-label trigger"
              :class="{
                collapsible: inputsCollapsible,
              }"
              @click.stop="toggleExpanded('input')"
            >
              <div class="text">
                inputs
              </div>
              <template v-if="hasInputFields">
                <UnfoldMoreIcon
                  v-if="!inputsExpanded"
                  :size="KUI_ICON_SIZE_20"
                />
                <UnfoldLessIcon
                  v-if="inputsExpanded"
                  :color="inputsCollapsible ? undefined : KUI_COLOR_TEXT_DISABLED"
                  :size="KUI_ICON_SIZE_20"
                />
              </template>
            </div>
            <HandleTwig
              v-if="hasInputFields && inputsExpanded"
              :color="handleTwigColor"
              :position="inputPosition"
              type="bar"
            />
          </div>
        </div>

        <template v-if="hasInputFields && inputsExpanded">
          <div
            v-for="(field, i) in data.fields.input"
            :key="`inputs-${field.id}`"
            class="handle indented"
          >
            <Handle
              :id="`inputs@${field.id}`"
              :position="inputPosition"
              type="target"
            />

            <!-- ValueIndicator of input fields -->
            <ValueIndicator
              v-if="getSpecialConnection(field.id)"
              :edge-id="getSpecialConnection(field.id)!.edgeId"
              mode="input"
              :reversed="isReversed"
              :source-field-name="getSpecialConnection(field.id)!.sourceFieldName"
              :source-node="getSpecialConnection(field.id)!.sourceNode"
            />

            <div class="handle-label-wrapper">
              <div class="handle-label text">
                {{ field.name }}
              </div>
              <HandleTwig
                :color="handleTwigColor"
                :position="inputPosition"
                :type="i < data.fields.input.length - 1 ? 'trident' : 'corner'"
              />
            </div>
          </div>
        </template>
      </div>

      <div
        v-if="showOutputHandles"
        class="output-handles"
        :class="{ 'has-fields': hasOutputFields }"
      >
        <div class="handle">
          <div class="handle-label-wrapper">
            <div
              class="handle-label trigger"
              :class="{
                collapsible: outputsCollapsible,
              }"
              @click.stop="toggleExpanded('output')"
            >
              <div class="text">
                outputs
              </div>
              <template v-if="hasOutputFields">
                <UnfoldMoreIcon
                  v-if="!outputsExpanded"
                  :size="KUI_ICON_SIZE_20"
                />
                <UnfoldLessIcon
                  v-if="outputsExpanded"
                  :color="outputsCollapsible ? undefined : KUI_COLOR_TEXT_DISABLED"
                  :size="KUI_ICON_SIZE_20"
                />
              </template>
            </div>
            <HandleTwig
              v-if="hasOutputFields && outputsExpanded"
              :color="handleTwigColor"
              :position="outputPosition"
              type="bar"
            />
          </div>
          <Handle
            id="output"
            :position="outputPosition"
            type="source"
          />

          <!-- ValueIndicator of output -->
          <ValueIndicator
            v-if="getSpecialOutputConnection('output')"
            mode="output"
            :reversed="isReversed"
            :target-field-names="getSpecialOutputConnection('output')!.targetFieldNames"
            :target-nodes="getSpecialOutputConnection('output')!.targetNodes"
          />
        </div>

        <template v-if="hasOutputFields && outputsExpanded">
          <div
            v-for="(field, i) in data.fields.output"
            :key="`outputs-${field.id}`"
            class="handle indented"
          >
            <div class="handle-label-wrapper">
              <div class="handle-label text">
                {{ field.name }}
              </div>
              <HandleTwig
                :color="handleTwigColor"
                :position="outputPosition"
                :type="i < data.fields.output.length - 1 ? 'trident' : 'corner'"
              />
            </div>
            <Handle
              :id="`outputs@${field.id}`"
              :position="outputPosition"
              type="source"
            />

            <!-- ValueIndicator of output fields -->
            <ValueIndicator
              v-if="getSpecialOutputConnection(field.id)"
              mode="output"
              :reversed="isReversed"
              :target-field-names="getSpecialOutputConnection(field.id)!.targetFieldNames"
              :target-nodes="getSpecialOutputConnection(field.id)!.targetNodes"
            />
          </div>
        </template>
      </div>

      <div
        v-if="hasBranchHandles"
        class="branch-handles"
      >
        <div
          v-for="branch in branchHandles"
          :key="`branch-${branch}`"
          class="handle"
        >
          <div class="handle-label-wrapper">
            <div class="handle-label text">
              {{ branch }}
            </div>
          </div>
          <Handle
            :id="`branch@${branch}`"
            :connectable="false"
            :position="branchPosition"
            type="source"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EdgeId, FieldId, FieldName, NodeField, NodeInstance } from '../../types'

import { computed, useTemplateRef, watch } from 'vue'
import { KTooltip, KButton, KDropdown, KDropdownItem } from '@kong/kongponents'
import { createI18n } from '@kong-ui-public/i18n'
import {
  KUI_COLOR_BACKGROUND_NEUTRAL_STRONG,
  KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER,
  KUI_COLOR_TEXT,
  KUI_COLOR_TEXT_DANGER,
  KUI_COLOR_TEXT_DISABLED,
  KUI_ICON_SIZE_20,
} from '@kong/design-tokens'
import { MoreIcon, UnfoldLessIcon, UnfoldMoreIcon, WarningIcon } from '@kong/icons'
import { Handle, Position } from '@vue-flow/core'

import english from '../../../../../locales/en.json'
import { isReadableProperty, isWritableProperty } from '../node/property'
import { useOptionalFlowStore } from '../store/flow'
import { getNodeMeta } from '../store/helpers'
import { useEditorStore } from '../store/store'
import HandleTwig from './HandleTwig.vue'
import { isImplicitNode } from './node'
import NodeBadge from './NodeBadge.vue'
import HotkeyLabel from '../HotkeyLabel.vue'
import { HOTKEYS } from '../../constants'
import { isEqual } from 'lodash-es'
import ValueIndicator from './ValueIndicator.vue'

const { data } = defineProps<{
  data: NodeInstance
  error?: boolean
  readonly?: boolean
}>()

const { t } = createI18n<typeof english>('en-us', english)

// FlowNode can be used in some tree that does not provide a flow store
// e.g., as a DND preview
const flowStore = useOptionalFlowStore()
const {
  getInEdgesByNodeId,
  getOutEdgesByNodeId,
  getNodeById,
  toggleExpanded: storeToggleExpanded,
  duplicateNode,
  removeNode,
  propertiesPanelOpen,
} = useEditorStore()

const meta = computed(() => getNodeMeta(data.type))

const hasInputFields = computed(() => data.fields.input.length > 0)
const hasOutputFields = computed(() => data.fields.output.length > 0)

const inputsCollapsible = computed(() =>
  hasInputFields.value && getInEdgesByNodeId(data.id).every(edge => edge.targetField === undefined),
)
const outputsCollapsible = computed(() =>
  hasOutputFields.value && getOutEdgesByNodeId(data.id).every(edge => edge.sourceField === undefined),
)

const inputsExpanded = computed(() => data.expanded.input ?? false)
const outputsExpanded = computed(() => data.expanded.output ?? false)

const branchHandles = computed(() => meta.value.io?.next?.branches?.map(({ name }) => name) ?? [])
const hasBranchHandles = computed(() => branchHandles.value.length > 0)

const showInputHandles = computed(() => {
  if (data.type === 'property') {
    // TODO: Should have a specific type for config in property nodes
    const property = data.config?.['property'] as string | undefined
    return isWritableProperty(property)
  }

  return meta.value.io?.input
})

const showOutputHandles = computed(() => {
  if (data.type === 'property') {
    // TODO: Should have a specific type for config in property nodes
    const property = data.config?.['property'] as string | undefined
    return isReadableProperty(property)
  }

  return meta.value.io?.output
})

const isImplicit = computed(() => isImplicitNode(data))

const isReversed = computed(() => {
  return data.phase === 'response'
})

const inputPosition = computed(() => {
  return data.phase === 'request' ? Position.Left : Position.Right
})

const outputPosition = computed(() => {
  return data.phase === 'request' ? Position.Right : Position.Left
})

const branchPosition = computed(() => {
  return data.phase === 'request' ? Position.Right : Position.Left
})

const name = computed(() => {
  return isImplicit.value ? t(`plugins.free-form.datakit.flow_editor.node_types.${data.type}.name`) : data.name
})

const handleTwigColor = computed(() => {
  return isImplicit.value ? KUI_COLOR_BACKGROUND_NEUTRAL_STRONG : KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER
})

// Special input connections (vault or cross-phase)
const specialInputConnections = computed(() => {
  const connections = new Map<string, {
    fieldId: FieldId | 'input'
    edgeId: EdgeId
    field: NodeField | null
    sourceNode: NodeInstance
    sourceFieldName?: FieldName
  }>()

  const inEdges = getInEdgesByNodeId(data.id)

  for (const edge of inEdges) {
    const sourceNode = getNodeById(edge.source)
    if (!sourceNode) continue

    const isVault = sourceNode.type === 'vault'

    const isCrossPhase = sourceNode.phase !== data.phase

    if (!isVault && !isCrossPhase) continue

    let sourceFieldName: FieldName | undefined
    if (edge.sourceField) {
      const sourceField = sourceNode.fields.output.find(f => f.id === edge.sourceField)
      sourceFieldName = sourceField?.name
    }

    if (edge.targetField) {
      const field = data.fields.input.find(f => f.id === edge.targetField)
      if (!field) continue

      connections.set(edge.targetField, {
        fieldId: edge.targetField,
        edgeId: edge.id,
        field,
        sourceNode,
        sourceFieldName,
      })
    } else {
      connections.set('input', {
        fieldId: 'input',
        edgeId: edge.id,
        field: null,
        sourceNode,
        sourceFieldName,
      })
    }
  }

  return connections
})

// Special output connections (cross-phase only)
const specialOutputConnections = computed(() => {
  const connections = new Map<string, {
    fieldId: FieldId | 'output'
    edgeIds: EdgeId[]
    field: NodeField | null
    targetNodes: NodeInstance[]
    targetFieldNames: Array<FieldName | undefined>
  }>()

  const outEdges = getOutEdgesByNodeId(data.id)

  for (const edge of outEdges) {
    const targetNode = getNodeById(edge.target)
    if (!targetNode) continue

    const isCrossPhase = targetNode.phase !== data.phase

    if (!isCrossPhase) continue

    let targetFieldName: FieldName | undefined
    if (edge.targetField) {
      const targetField = targetNode.fields.input.find(f => f.id === edge.targetField)
      targetFieldName = targetField?.name
    }

    const fieldKey = edge.sourceField || 'output'

    if (!connections.has(fieldKey)) {
      const field = edge.sourceField
        ? data.fields.output.find(f => f.id === edge.sourceField) || null
        : null

      connections.set(fieldKey, {
        fieldId: fieldKey,
        edgeIds: [],
        field,
        targetNodes: [],
        targetFieldNames: [],
      })
    }

    const connection = connections.get(fieldKey)!
    connection.edgeIds.push(edge.id)
    connection.targetNodes.push(targetNode)
    connection.targetFieldNames.push(targetFieldName)
  }

  return connections
})

function getSpecialConnection(fieldId: FieldId | 'input') {
  return specialInputConnections.value.get(fieldId)
}

function getSpecialOutputConnection(fieldId: FieldId | 'output') {
  return specialOutputConnections.value.get(fieldId)
}

function toggleExpanded(io: 'input' | 'output') {
  if (!flowStore || flowStore.readonly) return

  if (io === 'input' && !inputsCollapsible.value) return
  if (io === 'output' && !outputsCollapsible.value) return

  storeToggleExpanded(data.id, io)
}

async function duplicate() {
  if (!flowStore || flowStore.readonly) return

  const newId = duplicateNode(data.id, flowStore.placeToRight(data.id))

  await flowStore.selectNode(newId)
  flowStore.scrollRightToReveal(newId)
  propertiesPanelOpen.value = true
}

watch(inputsCollapsible, (collapsible) => {
  if (!collapsible) {
    storeToggleExpanded(data.id, 'input', true, true, '*')
  }
}, { immediate: true })

watch(outputsCollapsible, (collapsible) => {
  if (!collapsible) {
    storeToggleExpanded(data.id, 'output', true, true, '*')
  }
}, { immediate: true })

watch(() => data.fields.input, (input, oldInput) => {
  if (!isEqual(input, oldInput)) {
    storeToggleExpanded(data.id, 'input', input.length > 0, true, '*')
  }
}, { deep: true })

watch(() => data.fields.output, (output, oldOutput) => {
  if (!isEqual(output, oldOutput)) {
    storeToggleExpanded(data.id, 'output', output.length > 0, true, '*')
  }
}, { deep: true })


const menuRef = useTemplateRef('menu')
function closeMenu() {
  menuRef.value?.closeDropdown()
}
</script>

<style lang="scss" scoped>
@use "sass:math";

$node-border-width: 1px;
$node-max-width: 246px;
$node-min-width: 168px;
$handle-width: 3px;
$handle-height: 10px;
$io-column-min-width: 80px;
$io-column-min-width-no-fields: 70px;
$branch-handle-size: 4px;

.flow-node {
  background-color: $kui-color-background;
  border: 1px solid $kui-color-border-neutral-weak;
  border-radius: $kui-border-radius-20;
  cursor: move;
  max-width: $node-max-width;
  min-width: $node-min-width;
  padding: $kui-space-40 0;

  &.readonly {
    .menu {
      visibility: hidden;
    }
  }

  .body {
    align-items: flex-start;
    display: flex;
    gap: $kui-space-40;
    margin-bottom: $kui-space-40;
    padding: 0 $kui-space-40;

    .error-icon {
      align-self: flex-start;
    }

    .name {
      -webkit-box-orient: vertical;
      display: -webkit-box;
      flex: 1 1 auto;
      font-size: $kui-font-size-20;
      font-weight: $kui-font-weight-semibold;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      line-height: $kui-line-height-20;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-all;
      word-wrap: break-word;
    }

    .menu-trigger {
      height: 16px;
      width: 16px;

      :deep(.kui-icon) {
        height: 12px !important;
        width: 12px !important;
      }
    }

    .menu {
      :deep(.dropdown-trigger) {
        display: flex;
      }

      :global(.dk-flow-node-menu .dropdown-item-trigger) {
        font-size: $kui-font-size-20 !important;
        padding: $kui-space-30 $kui-space-40 !important;
      }
    }
  }

  .handles {
    display: flex;
    gap: $kui-space-30;

    &.reversed {
      flex-direction: row-reverse;
    }
  }

  .input-handles,
  .output-handles {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: $io-column-min-width-no-fields;
    position: relative;

    &.has-fields {
      min-width: $io-column-min-width;

      .trigger {
        cursor: pointer;

        &:not(.collapsible) {
          cursor: not-allowed;
        }
      }
    }

    .handle {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-30;
      justify-self: start;
      max-width: 100%;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      max-width: calc(100% - $kui-space-30);
      position: relative;

      .handle-label-wrapper {
        height: 100%;
        overflow: hidden;
        padding: $kui-space-30 0;
        position: relative;

        .handle-label {
          align-items: center;
          background-color: $kui-color-background-neutral-weaker;
          border-radius: $kui-border-radius-20;
          color: $kui-color-text-neutral-strong;
          display: flex;
          font-size: $kui-font-size-20;
          font-weight: $kui-font-weight-semibold;
          gap: $kui-space-20;
          line-height: $kui-line-height-10;
          padding: $kui-space-10;

          &.text {
            display: block;
          }
        }

        .text {
          overflow: hidden;
          text-overflow: ellipsis;
          /* improve visual valign for our use case */
          transform: translateY(-0.5px);
          white-space: nowrap;
        }
      }
    }

    :deep(.vue-flow__handle) {
      background-color: $kui-color-background-neutral;
      border: none;
      border-radius: $kui-border-radius-round;
      bottom: unset;
      flex: 1 0 auto;
      height: $handle-height;
      left: unset;
      min-width: 0;
      position: relative;
      right: unset;
      top: unset;
      transform: unset;
      width: $handle-width;

      &::before {
        content: "";
        inset: -4px -8px;
        position: absolute;
      }

      &::after {
        background-color: $kui-color-background-neutral;
        border-radius: $kui-border-radius-round;
        content: "";
        display: block;
        inset: 0;
        pointer-events: none;
        position: absolute;
        transition: box-shadow $kui-animation-duration-20 ease-in-out;
      }

      &.connecting::after,
      &:hover::after {
        background-color: $kui-color-background-primary;
        /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
        box-shadow: 0 0 0 1px $kui-color-background-primary;
      }
    }
  }

  .branch-handles {
    align-items: flex-end;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: $kui-space-20;

    .handle {
      align-items: center;
      display: flex;
      gap: $kui-space-30;
      padding-right: $kui-space-40;
      position: relative;

      .handle-label-wrapper {
        padding: $kui-space-20 0;

        .handle-label {
          background-color: transparent;
          color: $kui-color-text-neutral-strong;
          font-size: $kui-font-size-20;
          font-weight: $kui-font-weight-semibold;
          gap: $kui-space-20;
          line-height: $kui-line-height-10;
        }

        .text {
          transform: none;
        }
      }

      :deep(.vue-flow__handle) {
        background-color: $kui-color-background-neutral;
        border: none;
        border-radius: 0;
        height: $branch-handle-size;
        min-height: 0;
        min-width: 0;
        right: -0.5px;
        top: 50%;
        transform: translate(50%, -50%) rotate(45deg);
        transition: border-color $kui-animation-duration-20 ease-in-out,
          box-shadow $kui-animation-duration-20 ease-in-out,
          background-color $kui-animation-duration-20 ease-in-out;
        width: $branch-handle-size;
      }
    }
  }

  .input-handles {
    align-items: flex-start;
    transform: translateX(math.div($handle-width + $node-border-width, -2));

    .handle.indented .handle-label {
      margin-left: $kui-space-40;
    }
  }

  .output-handles {
    align-items: flex-end;
    transform: translateX(math.div($handle-width + $node-border-width, 2));

    .handle.indented .handle-label {
      margin-right: $kui-space-40;
    }
  }

  &.reversed {
    .input-handles,
    .output-handles,
    .branch-handles {
      .handle {
        flex-direction: row-reverse;
      }
    }

    .input-handles {
      align-items: flex-end;
      transform: translateX(math.div($handle-width + $node-border-width, 2));

      .handle.indented .handle-label {
        margin-left: unset;
        margin-right: $kui-space-40;
      }
    }

    .output-handles {
      align-items: flex-start;
      transform: translateX(math.div($handle-width + $node-border-width, -2));

      .handle.indented .handle-label {
        margin-left: $kui-space-40;
        margin-right: unset;
      }
    }

    .branch-handles {
      align-items: flex-start;

      .handle {
        padding-left: $kui-space-40;
        padding-right: 0;
      }

      :deep(.vue-flow__handle) {
        left: -0.5px;
        right: unset;
        transform: translate(-50%, -50%) rotate(45deg);
      }
    }
  }

  &.implicit {
    background-color: $kui-color-background-disabled;
    border-color: transparent; // Visually align with nodes with visible borders

    // Ensure specificity
    .input-handles,
    .output-handles {
      .handle .handle-label {
        background-color: $kui-color-background-neutral-strong;
        color: $kui-color-text-inverse;
      }
    }
  }
}

:global(.vue-flow__node:has(.vue-flow__handle.connecting)) {
  z-index: 10000 !important;
}
</style>
