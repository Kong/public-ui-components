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
      <div
        v-for="handle in meta.handles.input"
        :key="`input-${handle.id}`"
      >
        <div class="handle">
          <Handle
            :id="`input-${handle.id}`"
            :position="meta.ioDirection === 'rl' ? Position.Right : Position.Left"
            type="target"
          />

          <div class="handle-label">
            <div>{{ handle.label }}  </div>
            <UnfoldMoreIcon :size="KUI_ICON_SIZE_30" />
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="meta.handles?.output && meta.handles.output.length > 0"
      class="output-handles"
    >
      <div
        v-for="handle in meta.handles.output"
        :key="`output-${handle.id}`"
      >
        <div class="handle">
          <div class="handle-label">
            <div>{{ handle.label }}  </div>
            <UnfoldMoreIcon :size="KUI_ICON_SIZE_30" />
          </div>

          <Handle
            :id="`output-${handle.id}`"
            :position="meta.ioDirection === 'rl' ? Position.Left : Position.Right"
            type="source"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { UnfoldMoreIcon } from '@kong/icons'
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import english from '../../../../../locales/en.json'
import { isImplicit, type NodeMeta } from '../../types'

const props = defineProps<{
  meta: NodeMeta
}>()

const { t } = createI18n<typeof english>('en-us', english)

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
    gap: $kui-space-40;
    position: relative;

    .handle {
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: $kui-space-30;
      justify-self: start;

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
        padding: 0 $kui-space-10 0 $kui-space-20;
      }
    }

    :deep(.vue-flow__handle) {
      background-color: $kui-color-background-neutral; // gray.60 (we don't have a gray.50 in design tokens)
      border: none;
      border-radius: $kui-border-radius-round;
      bottom: unset;
      height: 12px;
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
  }

  .output-handles {
    align-items: flex-end;
    transform: translateX(1px);
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
    }

    .output-handles {
      align-items: flex-start;
      transform: translateX(-1px);
    }
  }

  &.implicit {
    background-color: $kui-color-background-disabled;
  }
}
</style>
