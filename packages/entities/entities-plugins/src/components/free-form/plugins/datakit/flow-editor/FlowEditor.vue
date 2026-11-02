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

import english from '../../../../../locales/en.json'
import { useFormShared } from '@kong-ui-public/freeform'
import { provideEditorStore, useLeaveConfirmation } from '../composables'
import { useCallErrorHandlingSupport } from './composables/useNodeForm'
import FlowPanels from './FlowPanels.vue'
import EditorModal from './modal/EditorModal.vue'
import { mergeFlowChange } from './store/helpers'

import type { ConfigNode, DatakitConfig, DatakitPluginData, DatakitUIData } from '../types'

const { t } = createI18n<typeof english>('en-us', english)

const { formData, setValue, getValue } = useFormShared<DatakitPluginData>()

const { isEditing } = defineProps<{
  isEditing?: boolean
}>()

const emit = defineEmits<{
  change: [config: DatakitConfig, uiData: DatakitUIData]
  error: [msg: string]
}>()

function onChange(configNodes: ConfigNode[], uiData: DatakitUIData, resources: DatakitConfig['resources'], partialId?: string) {
  const nextFormData = mergeFlowChange(formData, configNodes, uiData, resources, partialId)
  setValue(nextFormData)
  emit('change', nextFormData.config!, nextFormData.__ui_data!)
}

const { modalOpen, setPendingFitView } = provideEditorStore(getValue(), {
  onChange,
  isEditing,
  enableCallErrorHandling: useCallErrorHandlingSupport().value,
})

watch(modalOpen, () => {
  // `fitView` when model is toggled.
  setPendingFitView(true)
}, { flush: 'post' }) // Safely schedule fitView after <FlowPanels /> receives the latest `inactive` prop

useLeaveConfirmation({ enabled: modalOpen })
</script>

<style lang="scss" scoped>
.dk-flow-editor {
  .flow-panels-container {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
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
      transition: opacity var(--kui-animation-duration-20, $kui-animation-duration-20) ease-out;
      width: 100%;
      z-index: 200;

      &:hover {
        opacity: 1;
      }
    }
  }

  .button-open-editor {
    margin-top: var(--kui-space-70, $kui-space-70);
  }
}
</style>
