<template>
  <div
    class="dk-flow-node"
    :class="{
      reversed: isReversed,
      implicit: isImplicit,
      readonly,
    }"
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
            v-if="branchMembership"
            @click="removeFromBranchGroup"
          >
            {{ t('plugins.free-form.datakit.flow_editor.actions.remove_from_branch') }}
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

          <!-- NodePortal of input -->
          <NodePortal
            v-if="inputPortals.has('input')"
            mode="input"
            :reversed="isPortalReversed('input')"
            :targets="inputPortals.get('input')!"
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

            <!-- NodePortal of input fields -->
            <NodePortal
              v-if="inputPortals.has(field.id)"
              mode="input"
              :reversed="isPortalReversed('input')"
              :targets="inputPortals.get(field.id)!"
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

          <!-- NodePortal of output -->
          <NodePortal
            v-if="outputPortals.has('output')"
            mode="output"
            :reversed="isPortalReversed('output')"
            :targets="outputPortals.get('output')!"
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

            <!-- NodePortal of output fields -->
            <NodePortal
              v-if="outputPortals.has(field.id)"
              mode="output"
              :reversed="isPortalReversed('output')"
              :targets="outputPortals.get(field.id)!"
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
import type { EdgeId, FieldName, NodeInstance, NonEmptyArray } from '../../types'

import { computed, watch } from 'vue'
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
import { isEqual } from 'lodash-es'

import english from '../../../../../locales/en.json'
import { isReadableProperty, isWritableProperty } from '../node/property'
import { useOptionalFlowStore } from '../store/flow'
import { getNodeMeta } from '../store/helpers'
import { useEditorStore } from '../store/store'
import { HOTKEYS } from '../constants'
import { isImplicitNode } from './node'
import HotkeyLabel from '../HotkeyLabel.vue'
import NodePortal from './NodePortal.vue'
import HandleTwig from './HandleTwig.vue'
import NodeBadge from './NodeBadge.vue'

const { data, readonly } = defineProps<{
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
  branchGroups,
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
const branchMembership = computed(() => branchGroups.findMembership(data.id))

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

/**
 * Determines whether the NodePortal needs to flip to the opposite side.
 * Inputs inherit the node's reversed flag; outputs take the inverse.
 */
function isPortalReversed(mode: 'input' | 'output') {
  if (mode === 'input') {
    return isReversed.value
  }
  return !isReversed.value
}

type PortalTarget = { edgeId: EdgeId, node: NodeInstance, fieldName?: FieldName }

function collectPortals(io: 'input' | 'output') {
  const portals = new Map<string, NonEmptyArray<PortalTarget>>()
  const edges = io === 'input' ? getInEdgesByNodeId(data.id) : getOutEdgesByNodeId(data.id)

  for (const edge of edges) {
    const targetNode = getNodeById(io === 'input' ? edge.source : edge.target)
    if (!targetNode) continue

    if (io === 'input') {
      const isVault = targetNode.type === 'vault'
      const isCrossPhase = targetNode.phase !== data.phase
      const isEnteringGroup = branchGroups.isEdgeEnteringGroup(targetNode.id, data.id)
      if (!(isVault || isCrossPhase || isEnteringGroup)) continue
    } else {
      const isCrossPhase = targetNode.phase !== data.phase
      const isEnteringGroup = branchGroups.isEdgeEnteringGroup(data.id, targetNode.id)
      if (!(isCrossPhase || isEnteringGroup)) continue
    }

    const key = io === 'input'
      ? (edge.targetField || 'input')
      : (edge.sourceField || 'output')

    let fieldName: FieldName | undefined
    if (io === 'input' && edge.sourceField) {
      const field = targetNode.fields.output.find(f => f.id === edge.sourceField)
      fieldName = field?.name
    } else if (io === 'output' && edge.targetField) {
      const field = targetNode.fields.input.find(f => f.id === edge.targetField)
      fieldName = field?.name
    }

    const target: PortalTarget = {
      edgeId: edge.id,
      node: targetNode,
      fieldName,
    }
    const targets = portals.get(key)
    if (targets) {
      targets.push(target)
    } else {
      portals.set(key, [target])
    }
  }

  return portals
}

// Input portals (vault, cross-phase, or branch-group-entering)
const inputPortals = computed(() => collectPortals('input'))

// Output portals (cross-phase or branch-group-entering)
const outputPortals = computed(() => collectPortals('output'))

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

function removeFromBranchGroup() {
  branchGroups.removeMember(data.id)
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

$one-over-sqrt2-px: math.pow(2, -0.5) * 1px;

.dk-flow-node {
  background-color: var(--kui-color-background, $kui-color-background);
  border: 1px solid var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak);
  border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
  cursor: move;
  max-width: $node-max-width;
  min-width: $node-min-width;
  padding: var(--kui-space-40, $kui-space-40) 0;

  &.readonly {
    .menu {
      visibility: hidden;
    }
  }

  .body {
    align-items: flex-start;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    margin-bottom: var(--kui-space-40, $kui-space-40);
    padding: 0 var(--kui-space-40, $kui-space-40);

    .error-icon {
      align-self: flex-start;
    }

    .name {
      -webkit-box-orient: vertical;
      display: -webkit-box;
      flex: 1 1 auto;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      -webkit-line-clamp: 2;
      line-clamp: 2;
      line-height: var(--kui-line-height-20, $kui-line-height-20);
      overflow: hidden;
      overflow-wrap: break-word;
      text-overflow: ellipsis;
      word-break: break-all;
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
        font-size: var(--kui-font-size-20, $kui-font-size-20) !important;
        padding: var(--kui-space-30, $kui-space-30) var(--kui-space-40, $kui-space-40) !important;
      }
    }
  }

  .handles {
    display: flex;
    gap: var(--kui-space-30, $kui-space-30);

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
      gap: var(--kui-space-30, $kui-space-30);
      justify-self: start;
      max-width: 100%;
      /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
      max-width: calc(100% - var(--kui-space-30, $kui-space-30));
      position: relative;

      .handle-label-wrapper {
        height: 100%;
        overflow: hidden;
        padding: var(--kui-space-30, $kui-space-30) 0;
        position: relative;

        .handle-label {
          align-items: center;
          background-color: var(--kui-color-background-neutral-weaker, $kui-color-background-neutral-weaker);
          border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
          color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
          display: flex;
          font-size: var(--kui-font-size-20, $kui-font-size-20);
          font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
          gap: var(--kui-space-20, $kui-space-20);
          line-height: var(--kui-line-height-10, $kui-line-height-10);
          padding: var(--kui-space-10, $kui-space-10);

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
      background-color: var(--kui-color-background-neutral, $kui-color-background-neutral);
      border: none;
      border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
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
        background-color: var(--kui-color-background-neutral, $kui-color-background-neutral);
        border-radius: var(--kui-border-radius-round, $kui-border-radius-round);
        content: "";
        display: block;
        inset: 0;
        pointer-events: none;
        position: absolute;
        transition: box-shadow var(--kui-animation-duration-20, $kui-animation-duration-20) ease-in-out;
      }

      &.connecting::after,
      &:hover::after {
        background-color: var(--kui-color-background-primary, $kui-color-background-primary);
        /* stylelint-disable-next-line @kong/design-tokens/use-proper-token */
        box-shadow: 0 0 0 1px var(--kui-color-background-primary, $kui-color-background-primary);
      }
    }
  }

  .branch-handles {
    align-items: flex-end;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: var(--kui-space-20, $kui-space-20);

    .handle {
      align-items: center;
      display: flex;
      gap: var(--kui-space-30, $kui-space-30);
      padding-right: var(--kui-space-40, $kui-space-40);
      position: relative;

      .handle-label-wrapper {
        padding: var(--kui-space-20, $kui-space-20) 0;

        .handle-label {
          background-color: transparent;
          color: var(--kui-color-text-neutral-strong, $kui-color-text-neutral-strong);
          font-size: var(--kui-font-size-20, $kui-font-size-20);
          font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
          gap: var(--kui-space-20, $kui-space-20);
          line-height: var(--kui-line-height-10, $kui-line-height-10);
        }

        .text {
          transform: none;
        }
      }

      :deep(.vue-flow__handle) {
        background-color: transparent;
        border: none;
        border-radius: 0;
        height: $branch-handle-size;
        min-height: 0;
        min-width: 0;
        right: -0.5px;
        top: 50%;
        transform: translate(50%, -50%) rotate(45deg);
        width: $branch-handle-size;

        &::after {
          background-color: var(--kui-color-background-neutral, $kui-color-background-neutral);
          content: "";
          display: block;
          height: 100%;
          left: -$one-over-sqrt2-px;
          position: relative;
          top: -$one-over-sqrt2-px;
          width: 100%;
        }
      }
    }
  }

  .input-handles {
    align-items: flex-start;
    transform: translateX(math.div($handle-width + $node-border-width, -2));

    .handle.indented .handle-label {
      margin-left: var(--kui-space-40, $kui-space-40);
    }
  }

  .output-handles {
    align-items: flex-end;
    transform: translateX(math.div($handle-width + $node-border-width, 2));

    .handle.indented .handle-label {
      margin-right: var(--kui-space-40, $kui-space-40);
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
        margin-right: var(--kui-space-40, $kui-space-40);
      }
    }

    .output-handles {
      align-items: flex-start;
      transform: translateX(math.div($handle-width + $node-border-width, -2));

      .handle.indented .handle-label {
        margin-left: var(--kui-space-40, $kui-space-40);
        margin-right: unset;
      }
    }

    .branch-handles {
      align-items: flex-start;

      .handle {
        padding-left: var(--kui-space-40, $kui-space-40);
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
    background-color: var(--kui-color-background-disabled, $kui-color-background-disabled);
    border-color: transparent; // Visually align with nodes with visible borders

    // Ensure specificity
    .input-handles,
    .output-handles {
      .handle .handle-label {
        background-color: var(--kui-color-background-neutral-strong, $kui-color-background-neutral-strong);
        color: var(--kui-color-text-inverse, $kui-color-text-inverse);
      }
    }
  }
}

:global(.vue-flow__node:has(.dk-flow-node):has(.vue-flow__handle.connecting)) {
  z-index: 10000 !important;
}
</style>
