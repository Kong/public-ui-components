<template>
  <div
    class="flow-node"
    :class="{
      reversed: isReversed,
      implicit: isImplicit,
    }"
  >
    <div class="body">
      <div class="info-line">
        <div class="name">
          {{ name }}
        </div>

        <!-- TODO: Use small variant when available -->
        <NodeBadge
          v-if="!isImplicit"
          condensed
          :type="data.type"
        />
      </div>

      <slot />
    </div>

    <div
      class="handles"
      :class="{ reversed: isReversed }"
    >
      <div class="input-handles">
        <template v-if="showInputHandles">
          <div class="handle">
            <Handle
              id="input"
              :position="inputPosition"
              type="target"
            />

            <div class="handle-label-wrapper">
              <div
                class="handle-label"
                :class="{
                  'has-fields': data.fields.input.length > 0,
                  collapsible: inputsCollapsible
                }"
              >
                <div class="text">
                  inputs
                </div>
                <div
                  v-if="data.fields.input.length > 0"
                  class="icon"
                  @click.stop="toggleExpanded('input')"
                >
                  <UnfoldMoreIcon
                    v-if="!inputsExpanded"
                    :size="KUI_ICON_SIZE_20"
                  />
                  <UnfoldLessIcon
                    v-if="inputsExpanded"
                    :color="inputsCollapsible ? undefined : KUI_COLOR_TEXT_DISABLED"
                    :size="KUI_ICON_SIZE_20"
                  />
                </div>
              </div>
              <HandleTwig
                v-if="inputsExpanded"
                :color="handleTwigColor"
                :position="inputPosition"
                type="bar"
              />
            </div>
          </div>

          <template v-if="inputsExpanded">
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
        </template>
      </div>

      <div class="output-handles">
        <template v-if="showOutputHandles">
          <div class="handle">
            <div class="handle-label-wrapper">
              <div
                class="handle-label text"
                :class="{
                  'has-fields': data.fields.output.length > 0,
                  collapsible: outputsCollapsible
                }"
              >
                <div class="text">
                  outputs
                </div>
                <div
                  v-if="data.fields.output.length > 0"
                  class="icon"
                  @click.stop="toggleExpanded('output')"
                >
                  <UnfoldMoreIcon
                    v-if="!outputsExpanded"
                    :size="KUI_ICON_SIZE_20"
                  />
                  <UnfoldLessIcon
                    v-if="outputsExpanded"
                    :color="outputsCollapsible ? undefined : KUI_COLOR_TEXT_DISABLED"
                    :size="KUI_ICON_SIZE_20"
                  />
                </div>
              </div>
              <HandleTwig
                v-if="outputsExpanded"
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
          </div>

          <template v-if="outputsExpanded">
            <div
              v-for="(field, i) in data.fields.output"
              :key="`outputs-${field.id}`"
              class="handle indented"
            >
              <div class="handle-label-wrapper">
                <div class="handle-label">
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
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import {
  KUI_COLOR_BACKGROUND_NEUTRAL_STRONG,
  KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER,
  KUI_COLOR_TEXT_DISABLED,
  KUI_ICON_SIZE_20,
} from '@kong/design-tokens'
import { UnfoldLessIcon, UnfoldMoreIcon } from '@kong/icons'
import { Handle, Position } from '@vue-flow/core'
import { computed, watch } from 'vue'
import english from '../../../../../locales/en.json'
import HandleTwig from './HandleTwig.vue'
import { isImplicitNode } from './node'

import type { NodeInstance } from '../../types'
import { isReadableProperty, isWritableProperty } from '../node/property'
import { getNodeMeta } from '../store/helpers'
import { useEditorStore } from '../store/store'
import NodeBadge from './NodeBadge.vue'

const { data } = defineProps<{
  data: NodeInstance
}>()

const { t } = createI18n<typeof english>('en-us', english)

const { getInEdgesByNodeId, getOutEdgesByNodeId, toggleExpanded: storeToggleExpanded } = useEditorStore()

const meta = computed(() => getNodeMeta(data.type))

const inputsCollapsible = computed(() =>
  getInEdgesByNodeId(data.id).every(edge => edge.targetField === undefined),
)
const outputsCollapsible = computed(() =>
  getOutEdgesByNodeId(data.id).every(edge => edge.sourceField === undefined),
)

const inputsExpanded = computed(() => data.expanded.input ?? false)
const outputsExpanded = computed(() => data.expanded.output ?? false)

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

const name = computed(() => {
  return isImplicit.value ? t(`plugins.free-form.datakit.flow_editor.node_types.${data.type}.name`) : data.name
})

const handleTwigColor = computed(() => {
  return isImplicit.value ? KUI_COLOR_BACKGROUND_NEUTRAL_STRONG : KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER
})

function toggleExpanded(io: 'input' | 'output') {
  if (io === 'input' && !inputsCollapsible.value) return
  if (io === 'output' && !outputsCollapsible.value) return

  storeToggleExpanded(data.id, io)
}

watch(inputsCollapsible, (collapsible) => {
  if (!collapsible) {
    storeToggleExpanded(data.id, 'input', true)
  }
}, { immediate: true })

watch(outputsCollapsible, (collapsible) => {
  if (!collapsible) {
    storeToggleExpanded(data.id, 'output', true)
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use "sass:math";

$node-border-width: 1px;
$handle-width: 3px;
$handle-height: 10px;

.flow-node {
  background-color: $kui-color-background;
  border: 1px solid $kui-color-border-neutral-weak;
  border-radius: $kui-border-radius-20;
  min-width: 120px;
  padding: $kui-space-40 0;

  .body {
    padding: 0 $kui-space-40;

    .info-line {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-40;
      justify-content: space-between;
      margin-bottom: $kui-space-40;
      width: 100%;

      .name {
        font-size: $kui-font-size-20;
        font-weight: $kui-font-weight-semibold;
        line-height: $kui-line-height-20;
      }
    }
  }

  .handles {
    display: flex;
    flex-direction: row;
    gap: $kui-space-80;
    justify-content: space-between;
    width: 100%;

    &.reversed {
      flex-direction: row-reverse;
    }
  }

  .input-handles,
  .output-handles {
    display: flex;
    flex-direction: column;
    position: relative;

    .handle {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-30;
      justify-self: start;
      position: relative;

      .handle-label-wrapper {
        height: 100%;
        padding: $kui-space-20 0;
        position: relative;

        .handle-label {
          align-items: center;
          background-color: $kui-color-background-neutral-weaker;
          border-radius: $kui-border-radius-20;
          color: $kui-color-text-neutral-strong;
          display: flex;
          flex-direction: row;
          font-size: $kui-font-size-20;
          font-weight: $kui-font-weight-semibold;
          gap: $kui-space-40;
          line-height: $kui-line-height-10;
          padding: $kui-space-10;

          .text {
            /* improve visual valign for our use case */
            transform: translateY(-0.5px);
          }

          &.has-fields .icon {
            cursor: pointer;
          }

          &:not(.collapsible) .icon {
            cursor: not-allowed;
          }
        }
      }
    }

    :deep(.vue-flow__handle) {
      background-color: $kui-color-background-neutral; // gray.60 (we don't have a gray.50 in design tokens)
      border: none;
      border-radius: $kui-border-radius-round;
      bottom: unset;
      height: $handle-height;
      left: unset;
      min-width: 0;
      position: relative;
      right: unset;
      top: unset;
      transform: unset;
      width: $handle-width;
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
    .output-handles {
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
</style>
