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
        <KButton @click="close">
          {{ t('plugins.free-form.datakit.flow_editor.done') }}
        </KButton>
      </div>
    </header>

    <div
      ref="canvasContainer"
      class="body"
    >
      <EditorCanvas>
        <template #request>
          <EditorCanvasFlow
            phase="request"
            @click:backdrop="emit('click:backdrop')"
            @click:node="emit('click:node', $event)"
          />
        </template>

        <template #response>
          <EditorCanvasFlow
            phase="response"
            @click:backdrop="emit('click:backdrop')"
            @click:node="emit('click:node', $event)"
          />
        </template>
      </EditorCanvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NodeInstance } from '../../types'

import { createI18n } from '@kong-ui-public/i18n'
import { ExternalLinkIcon } from '@kong/icons'
import { KButton } from '@kong/kongponents'
import english from '../../../../../locales/en.json'
import { useEditorStore } from '../store/store'
import EditorCanvas from './EditorCanvas.vue'
import EditorCanvasFlow from './EditorCanvasFlow.vue'

import '@vue-flow/controls/dist/style.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const { t } = createI18n<typeof english>('en-us', english)

defineSlots<{
  default(): any
}>()

const emit = defineEmits<{
  'click:node': [node: NodeInstance]
  'click:backdrop': []
}>()

const { modalOpen } = useEditorStore()

function close() {
  modalOpen.value = false
}
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
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
  }
}
</style>
