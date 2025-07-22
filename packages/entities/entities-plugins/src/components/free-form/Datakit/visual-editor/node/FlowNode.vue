<template>
  <div
    class="flow-node"
    :class="{
      reverse: meta.ioDirection === 'rl',
      implicit: isImplicit(meta)
    }"
  >
    <div class="body">
      <div class="name">
        {{ name }}
      </div>

      <slot />
    </div>

    <div
      v-if="meta.handles?.input && meta.handles.input.length > 0"
      class="input-handles"
    >
      <div class="handle">
        <Handle
          id="inputs"
          :position="meta.ioDirection === 'rl' ? Position.Right : Position.Left"
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
            :direction="meta.ioDirection === 'rl' ? 'right' : 'left'"
            type="bar"
          />
        </div>
      </div>

      <template v-if="inputHandlesExpanded">
        <div
          v-for="(handle, i) in meta.handles.input"
          :key="`input-${handle.id}`"
          class="handle indented"
        >
          <Handle
            :id="`input-${handle.id}`"
            :position="meta.ioDirection === 'rl' ? Position.Right : Position.Left"
            type="target"
          />
          <div class="handle-label-wrapper">
            <div class="handle-label">
              {{ handle.label }}
            </div>
            <HandleTwig
              :color="KUI_COLOR_BACKGROUND_NEUTRAL_STRONG"
              :direction="meta.ioDirection === 'rl' ? 'right' : 'left'"
              :type="i < meta.handles.input.length - 1 ? 'trident' : 'corner'"
            />
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="meta.handles?.output && meta.handles.output.length > 0"
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
            :direction="meta.ioDirection === 'rl' ? 'left' : 'right'"
            type="bar"
          />
        </div>
        <Handle
          id="outputs"
          :position="meta.ioDirection === 'rl' ? Position.Left : Position.Right"
          type="target"
        />
      </div>

      <template v-if="outputHandlesExpanded">
        <div
          v-for="(handle, i) in meta.handles.output"
          :key="`output-${handle.id}`"
          class="handle indented"
        >
          <div class="handle-label-wrapper">
            <div class="handle-label">
              {{ handle.label }}
            </div>
            <HandleTwig
              :color="KUI_COLOR_BACKGROUND_NEUTRAL_STRONG"
              :direction="meta.ioDirection === 'rl' ? 'left' : 'right'"
              :type="i < meta.handles.output.length - 1 ? 'trident' : 'corner'"
            />
          </div>
          <Handle
            :id="`output-${handle.id}`"
            :position="meta.ioDirection === 'rl' ? Position.Left : Position.Right"
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
import { isImplicit, type NodeMeta } from '../../types'
import HandleTwig from './HandleTwig.vue'

const props = defineProps<{
  meta: NodeMeta
}>()

const { t } = createI18n<typeof english>('en-us', english)

const inputHandlesExpanded = ref(false)
const outputHandlesExpanded = ref(false)

const name = computed(() => {
  if (isImplicit(props.meta)) {
    return t(`plugins.free-form.datakit.visual_editor.node_names.${props.meta.type}`)
  }
  return '' // TBD for user nodes
})
</script>

<style lang="scss" scoped>
.flow-node {
  border-radius: $kui-border-radius-20;
  min-width: 120px;
  padding: $kui-space-40 0;

  .body {
    padding: 0 $kui-space-40;

    .name {
      font-weight: $kui-font-weight-semibold;
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
      height: 10px;
      left: unset;
      position: relative;
      right: unset;
      top: unset;
      transform: unset;
      width: 3px;
    }
  }

  .input-handles {
    align-items: flex-start;
    transform: translateX(-1px);

    .handle.indented .handle-label {
      margin-left: $kui-space-40;
    }
  }

  .output-handles {
    align-items: flex-end;
    transform: translateX(1px);

    .handle.indented .handle-label {
      margin-right: $kui-space-40;
    }
  }

  &.reverse {
    .input-handles,
    .output-handles {
      .handle {
        flex-direction: row-reverse;
      }
    }

    .input-handles {
      align-items: flex-end;
      transform: translateX(1px);

      .handle.indented .handle-label {
        margin-left: unset;
        margin-right: $kui-space-40;
      }
    }

    .output-handles {
      align-items: flex-start;
      transform: translateX(-1px);

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
