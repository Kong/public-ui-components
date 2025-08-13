<template>
  <div class="dk-flow-editor">
    <div class="flow-panels-container">
      <FlowPanels :editing="false" />
    </div>

    <KButton
      appearance="secondary"
      class="button-open-editor"
      @click="modalOpen = true"
    >
      {{ t('plugins.free-form.datakit.flow_editor.cta') }}
    </KButton>

    <EditorModal v-model:open="modalOpen" />
    <div class="field">
      <BooleanField
        name="config.debug"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import { watch } from 'vue'

import english from '../../../../locales/en.json'
import BooleanField from '../../shared/BooleanField.vue'
import { provideEditorStore } from '../composables'
import FlowPanels from './FlowPanels.vue'
import EditorModal from './modal/EditorModal.vue'

import type { DatakitConfig } from '../types'

const { t } = createI18n<typeof english>('en-us', english)

const { config } = defineProps<{
  editing: boolean
  config?: DatakitConfig
}>()

const emit = defineEmits<{
  change: [config: DatakitConfig]
  error: [msg: string]
}>()

function onChange(newConfig: DatakitConfig) {
  emit('change', {
    ...config,
    ...newConfig,
  })
}

const { modalOpen, load } = provideEditorStore(config?.nodes ?? [], [], { onChange })

watch(() => config?.nodes, (newNodes) => {
  // Only load if the modal is not open
  if (modalOpen.value) {
    return
  }
  load(newNodes ?? [], [])
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
}

.button-open-editor {
  margin-top: $kui-space-70;
}
</style>
