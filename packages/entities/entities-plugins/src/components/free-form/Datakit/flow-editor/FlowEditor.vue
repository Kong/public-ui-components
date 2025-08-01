<template>
  <div class="dk-flow-editor">
    <div>Nothing here yet.</div>
    <KButton
      appearance="secondary"
      @click="modalOpen = true"
    >
      {{ t('plugins.free-form.datakit.flow_editor.cta') }}
    </KButton>
    <EditorModal v-model:open="modalOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../locales/en.json'
import EditorModal from './modal/EditorModal.vue'
import { provideEditorState } from '../composables'

const { t } = createI18n<typeof english>('en-us', english)

defineProps<{
  editing: boolean
  config: any
}>()

const modalOpen = ref(false)

provideEditorState([
  // todo(zehao): mock data, remove me
  {
    type: 'call',
    name: 'MY_CALL' as any,
    url: 'https://example.com',
    method: 'POST',
    timeout: 5000,
    ssl_server_name: 'example.com',
    inputs: {
      headers: 'request.headers',
      body: 'request.body',
      query: 'request.query',
    },
    // input: 'request',
  },
], [])
</script>
