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

    <div class="body">
      <VueFlow
        class="flow"
        :nodes="nodes"
        @click="emit('click:backdrop')"
        @nodes-initialized="fitView"
      >
        <Background @click="emit('click:backdrop')" />
        <Controls />

        <!-- To not use the default node style -->
        <template #node-flow="node">
          <FlowNode :meta="node.data" />
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
import { useVueFlow, VueFlow, type Node } from '@vue-flow/core'
import { ref } from 'vue'
import english from '../../../../../locales/en.json'
import FlowNode from '../node/FlowNode.vue'
import { IMPLICIT_NODE_META_MAP } from '../node/node-meta'

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
    type: 'flow', // To not use the default node style
    position: { x: 0, y: 0 },
    data: IMPLICIT_NODE_META_MAP.request,
  },
  {
    id: 'implicit:service-request',
    type: 'flow', // To not use the default node style
    position: { x: 500, y: 0 },
    data: IMPLICIT_NODE_META_MAP.service_request,
  },
  {
    id: 'implicit:service-response',
    type: 'flow', // To not use the default node style
    position: { x: 500, y: 300 },
    data: IMPLICIT_NODE_META_MAP.service_response,
  },
  {
    id: 'implicit:response',
    type: 'flow', // To not use the default node style
    position: { x: 0, y: 300 },
    data: IMPLICIT_NODE_META_MAP.response,
  },
])

const { fitView, onNodeClick } = useVueFlow()

onNodeClick(({ event, node }) => {
  event.stopPropagation()
  emit('click:node', node)
})
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
