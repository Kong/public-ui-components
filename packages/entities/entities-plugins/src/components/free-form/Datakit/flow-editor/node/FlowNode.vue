<template>
  <div
    class="flow-node"
    :class="{
      reversed: isReversed,
      implicit: isImplicitNode,
    }"
  >
    <div class="body">
      <div class="info-line">
        <div class="name">
          {{ name }}
        </div>

        <!-- TODO: Use small variant when available -->
        <NodeBadge
          v-if="!isImplicitNode"
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
        <template v-if="data.fields?.input && data.fields.input.length > 0">
          <div class="handle">
            <Handle
              id="inputs"
              :position="inputPosition"
              type="target"
            />

            <div class="handle-label-wrapper">
              <div
                class="handle-label with-icon"
                @click.stop="inputHandlesExpanded = !inputHandlesExpanded"
              >
                <div>inputs</div>
                <UnfoldMoreIcon
                  v-if="!inputHandlesExpanded"
                  :size="KUI_ICON_SIZE_30"
                />
                <UnfoldLessIcon
                  v-if="inputHandlesExpanded"
                  :size="KUI_ICON_SIZE_30"
                />
              </div>
              <HandleTwig
                v-if="inputHandlesExpanded"
                :color="handleTwigColor"
                :position="inputPosition"
                type="bar"
              />
            </div>
          </div>

          <template v-if="inputHandlesExpanded">
            <div
              v-for="(fieldName, i) in data.fields.input"
              :key="`input-${fieldName}`"
              class="handle indented"
            >
              <Handle
                :id="`input-${fieldName}`"
                :position="inputPosition"
                type="target"
              />
              <div class="handle-label-wrapper">
                <div class="handle-label">
                  {{ fieldName }}
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
        <template v-if="data.fields?.output && data.fields.output.length > 0">
          <div class="handle">
            <div class="handle-label-wrapper">
              <div
                class="handle-label with-icon"
                @click.stop="outputHandlesExpanded = !outputHandlesExpanded"
              >
                <div>outputs</div>
                <UnfoldMoreIcon
                  v-if="!outputHandlesExpanded"
                  :size="KUI_ICON_SIZE_30"
                />
                <UnfoldLessIcon
                  v-if="outputHandlesExpanded"
                  :size="KUI_ICON_SIZE_30"
                />
              </div>
              <HandleTwig
                v-if="outputHandlesExpanded"
                :color="handleTwigColor"
                :position="outputPosition"
                type="bar"
              />
            </div>
            <Handle
              id="outputs"
              :position="outputPosition"
              type="target"
            />
          </div>

          <template v-if="outputHandlesExpanded">
            <div
              v-for="(fieldName, i) in data.fields.output"
              :key="`output-${fieldName}`"
              class="handle indented"
            >
              <div class="handle-label-wrapper">
                <div class="handle-label">
                  {{ fieldName }}
                </div>
                <HandleTwig
                  :color="handleTwigColor"
                  :position="outputPosition"
                  :type="i < data.fields.output.length - 1 ? 'trident' : 'corner'"
                />
              </div>
              <Handle
                :id="`output-${fieldName}`"
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
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'
import { UnfoldLessIcon, UnfoldMoreIcon } from '@kong/icons'
import { Handle, Position } from '@vue-flow/core'
import { computed, ref } from 'vue'
import english from '../../../../../locales/en.json'
import HandleTwig from './HandleTwig.vue'
import { isImplicitNode } from './node'

import NodeBadge from './NodeBadge.vue'
import type { NodeInstance } from '../../types'

const { data } = defineProps<{
  data: NodeInstance
}>()

const { t } = createI18n<typeof english>('en-us', english)

const inputHandlesExpanded = ref(false)
const outputHandlesExpanded = ref(false)

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
          cursor: pointer;
          display: flex;
          flex-direction: row;
          font-size: $kui-font-size-20;
          font-weight: $kui-font-weight-semibold;
          gap: $kui-space-20;
          padding: 0 $kui-space-10;

          &.with-icon {
            padding: 0 $kui-space-10 0 $kui-space-20;
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
