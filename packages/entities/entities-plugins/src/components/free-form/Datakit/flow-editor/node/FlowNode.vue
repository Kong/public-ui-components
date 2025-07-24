<template>
  <div
    class="flow-node"
    :class="{
      reversed: isReversed,
      implicit: isImplicit(data)
    }"
  >
    <div class="body">
      <div class="name">
        {{ name }}
      </div>

      <slot />
    </div>

    <div
      v-if="data.fields?.input && data.fields.input.length > 0"
      class="input-handles"
    >
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
            <UnfoldMoreIcon :size="KUI_ICON_SIZE_30" />
          </div>
          <HandleTwig
            v-if="inputHandlesExpanded"
            :color="KUI_COLOR_BACKGROUND_NEUTRAL_STRONG"
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
              :color="KUI_COLOR_BACKGROUND_NEUTRAL_STRONG"
              :position="inputPosition"
              :type="i < data.fields.input.length - 1 ? 'trident' : 'corner'"
            />
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="data.fields?.output && data.fields.output.length > 0"
      class="output-handles"
    >
      <div class="handle">
        <div class="handle-label-wrapper">
          <div
            class="handle-label with-icon"
            @click.stop="outputHandlesExpanded = !outputHandlesExpanded"
          >
            <div>outputs</div>
            <UnfoldMoreIcon :size="KUI_ICON_SIZE_30" />
          </div>
          <HandleTwig
            v-if="outputHandlesExpanded"
            :color="KUI_COLOR_BACKGROUND_NEUTRAL_STRONG"
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
              :color="KUI_COLOR_BACKGROUND_NEUTRAL_STRONG"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { KUI_COLOR_BACKGROUND_NEUTRAL_STRONG, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { UnfoldMoreIcon } from '@kong/icons'
import { Handle, Position } from '@vue-flow/core'
import { computed, ref } from 'vue'
import english from '../../../../../locales/en.json'
import { isImplicit } from './node'
import HandleTwig from './HandleTwig.vue'

import type { NodeData } from '../../types'

const { data } = defineProps<{
  data: NodeData
}>()

const { t } = createI18n<typeof english>('en-us', english)

const inputHandlesExpanded = ref(false)
const outputHandlesExpanded = ref(false)

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
  if (isImplicit(data)) {
    return t(`plugins.free-form.datakit.flow_editor.node_types.${data.type}.name`)
  }
  return '' // TBD for user nodes
})
</script>

<style lang="scss" scoped>
@use "sass:math";

$handle-width: 3px;
$handle-height: 10px;

.flow-node {
  border-radius: $kui-border-radius-20;
  min-width: 120px;
  padding: $kui-space-40 0;

  .body {
    padding: 0 $kui-space-40;

    .name {
      font-weight: $kui-font-weight-semibold;
      line-height: $kui-line-height-20;
      margin-bottom: $kui-space-40;
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
          background-color: $kui-color-background-neutral-strong;
          border-radius: $kui-border-radius-20;
          color: $kui-color-text-inverse;
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
    transform: translateX(math.div($handle-width, -2));

    .handle.indented .handle-label {
      margin-left: $kui-space-40;
    }
  }

  .output-handles {
    align-items: flex-end;
    transform: translateX(math.div($handle-width, 2));

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
      transform: translateX(math.div($handle-width, 2));

      .handle.indented .handle-label {
        margin-left: unset;
        margin-right: $kui-space-40;
      }
    }

    .output-handles {
      align-items: flex-start;
      transform: translateX(math.div($handle-width, -2));

      .handle.indented .handle-label {
        margin-left: $kui-space-40;
        margin-right: unset;
      }
    }
  }

  &.implicit {
    background-color: $kui-color-background-disabled;
  }
}
</style>
