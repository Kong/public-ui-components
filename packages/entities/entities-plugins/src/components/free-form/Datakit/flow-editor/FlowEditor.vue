<template>
  <div class="dk-flow-editor">
    <div class="flow-panels-container">
      <FlowPanels
        :inactive="modalOpen"
        mode="preview"
      />

      <div class="overlay">
        <KButton
          appearance="secondary"
          class="button-open-editor"
          @click="modalOpen = true"
        >
          {{ t('plugins.free-form.datakit.flow_editor.cta') }}

          <ExpandIcon />
        </KButton>
      </div>
    </div>

    <EditorModal v-model:open="modalOpen" />
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { ExpandIcon } from '@kong/icons'
import { watch } from 'vue'

import english from '../../../../locales/en.json'
import { useFormShared } from '../../shared/composables'
import { provideEditorStore } from '../composables'
import FlowPanels from './FlowPanels.vue'
import EditorModal from './modal/EditorModal.vue'

import type { ConfigNode, DatakitConfig, DatakitPluginData, DatakitUIData, UINode } from '../types'

const { t } = createI18n<typeof english>('en-us', english)

const { formData } = useFormShared<DatakitPluginData>()

const { isEditing } = defineProps<{
  isEditing?: boolean
}>()

const emit = defineEmits<{
  change: [config: DatakitConfig, uiData: DatakitUIData]
  error: [msg: string]
}>()

function onChange(configNodes: ConfigNode[], uiNodes: UINode[]) {
  const nextConfig = { ...formData.config, nodes: configNodes }
  const nextUIData = { ...formData.__ui_data, nodes: uiNodes }
  formData.config = nextConfig
  formData.__ui_data = nextUIData
  emit('change', nextConfig, nextUIData)
}

const { modalOpen, setPendingFitView } = provideEditorStore(formData, {
  onChange,
  isEditing,
})

watch(modalOpen, () => {
  // `fitView` when model is toggled.
  setPendingFitView(true)
}, { flush: 'post' }) // Safely schedule fitView after <FlowPanels /> receives the latest `inactive` prop
</script>

<style lang="scss" scoped>
.dk-flow-editor {
  .flow-panels-container {
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-30;
    height: 560px;
    overflow: hidden;
    position: relative;

    .overlay {
      align-items: center;
      backdrop-filter: blur(6px);
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: center;
      left: 0;
      opacity: 0;
      position: absolute;
      top: 0;
      transition: opacity $kui-animation-duration-20 ease-out;
      width: 100%;
      z-index: 200;

      &:hover {
        opacity: 1;
      }
    }
  }

  .button-open-editor {
    margin-top: $kui-space-70;
  }
}
</style>
