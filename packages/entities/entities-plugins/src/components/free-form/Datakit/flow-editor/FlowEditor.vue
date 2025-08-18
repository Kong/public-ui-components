<template>
  <div class="dk-flow-editor">
    <KButton
      appearance="secondary"
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
import { watch } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../locales/en.json'
import { provideEditorStore } from '../composables'
import BooleanField from '../../shared/BooleanField.vue'
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
</style>
