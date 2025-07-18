<template>
  <div class="dk-editor-main">
    <header class="header">
      <div class="actions">
        <KButton
          appearance="tertiary"
          target="_blank"
          to="https://developer.konghq.com/plugins/datakit/"
        >
          {{ t('plugins.free-form.datakit.flow_editor.view_docs') }}
          <ExternalLinkIcon />
        </KButton>
        <KButton>
          {{ t('plugins.free-form.datakit.flow_editor.save') }}
        </KButton>
      </div>
    </header>

    <div
      class="body"
      @click="emit('click:backdrop')"
    >
      <button @click.stop="emit('click:node', { id: 'node-a', name: 'Node A' })">
        Mock Node A
      </button>
      <button @click.stop="emit('click:node', { id: 'node-b', name: 'Node b' })">
        Mock Node B
      </button>

      <VueFlow
        class="flow"
        :nodes="nodes"
      >
        <Background />
        <Controls />

        <template #node-request>
          <RequestNode />
        </template>
        <template #node-response>
          <ResponseNode />
        </template>
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { ExternalLinkIcon } from '@kong/icons'
import { KButton } from '@kong/kongponents'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow, type Node } from '@vue-flow/core'
import { ref } from 'vue'
import english from '../../../../../locales/en.json'
import RequestNode from '../node/nodes/RequestNode.vue'
import ResponseNode from '../node/nodes/ResponseNode.vue'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const { t } = createI18n<typeof english>('en-us', english)

defineSlots<{
  default(): any
}>()

const emit = defineEmits<{
  'click:node': [node: any]
  'click:backdrop': []
}>()

const nodes = ref<Node[]>([
  {
    id: 'implicit:request',
    type: 'request',
    position: { x: 0, y: 0 },
  },
  {
    id: 'implicit:service-request',
    type: 'response',
    position: { x: 300, y: 0 },
  },
])
</script>

<style lang="scss" scoped>
.dk-editor-main {
  display: flex;
  flex-direction: column;
  height: 100%;

  .header {
    align-items: center;
    border-bottom: 1px solid $kui-color-border;
    display: flex;
    flex: 0 0 auto;
    /* stylelint-disable-next-line custom-property-pattern */
    height: var(--dk-header-height);
    justify-content: flex-end;
    padding: 0px $kui-space-30 0px $kui-space-50;
  }

  .actions {
    display: flex;
    gap: $kui-space-30;
  }

  .body {
    height: 100%;
    width: 100%;
  }

  .flow {
    :deep(.vue-flow__controls) {
      bottom: 0;
      left: unset;
      right: 0;
    }

    :deep(.vue-flow__controls-button) {
      // Ensure it works in both the sandbox and host apps
      box-sizing: content-box;
    }
  }
}
</style>
