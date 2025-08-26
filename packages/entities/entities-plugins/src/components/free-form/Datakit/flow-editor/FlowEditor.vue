<template>
  <div class="dk-flow-editor">
    <div class="flow-panels-container">
      <FlowPanels
        ref="flowPanels"
        readonly
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

    <div class="field">
      <BooleanField
        name="config.debug"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConfigNode, DatakitConfig, DatakitUIData, UINode } from '../types'

import { createI18n } from '@kong-ui-public/i18n'
import { ExpandIcon } from '@kong/icons'
import { useTemplateRef, watch } from 'vue'

import english from '../../../../locales/en.json'
import BooleanField from '../../shared/BooleanField.vue'
import { provideEditorStore } from '../composables'
import FlowPanels from './FlowPanels.vue'
import EditorModal from './modal/EditorModal.vue'

const { t } = createI18n<typeof english>('en-us', english)

const { config, uiData, isEditing } = defineProps<{
  config?: DatakitConfig
  uiData?: DatakitUIData
  isEditing?: boolean
}>()

const emit = defineEmits<{
  change: [config: DatakitConfig, uiData: DatakitUIData]
  error: [msg: string]
}>()

const flowPanels = useTemplateRef('flowPanels')

function onChange(configNodes: ConfigNode[], uiNodes: UINode[]) {
  emit('change',
    { ...config, nodes: configNodes },
    { ...uiData, nodes: uiNodes },
  )
}

const { modalOpen } = provideEditorStore(config?.nodes ?? [], uiData?.nodes ?? [], {
  onChange,
  isEditing,
})

watch(modalOpen, () => {
  if (!modalOpen.value) {
    flowPanels.value?.fitView()
  }
})
</script>

<style lang="scss" scoped>
.dk-flow-editor {
  .field {
    margin-top: $kui-space-80;
  }
}

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
</style>
