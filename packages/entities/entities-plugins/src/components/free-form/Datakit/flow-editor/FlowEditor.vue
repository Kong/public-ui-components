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
import { createI18n } from '@kong-ui-public/i18n'
import { ref } from 'vue'
import english from '../../../../locales/en.json'
import { provideEditorStore } from '../composables'
import type { ConfigNodeName, FieldName, NameConnection } from '../types'
import EditorModal from './modal/EditorModal.vue'

const { t } = createI18n<typeof english>('en-us', english)

defineProps<{
  editing: boolean
  config: any
}>()

const modalOpen = ref(false)

// todo(zehao): mock data, remove later
// provideEditorStore(MockData.configNodes, MockData.uiNodes)

provideEditorStore([
  {
    name: 'CAT_FACT' as ConfigNodeName ,
    type: 'call',
    url: 'https://catfact.ninja/fact',
    input: 'request.body' as NameConnection,
  },
  {
    name: 'DOG_FACT' as ConfigNodeName,
    type: 'call',
    url: 'https://dogapi.dog/api/v1/facts',
  },
  {
    name: 'JOIN' as ConfigNodeName,
    type: 'jq',
    inputs: {
      cat: 'CAT_FACT.body',
      dog: 'DOG_FACT.body',
    } as Record<FieldName, NameConnection>,
    jq: '{\n  cat_fact: .cat.fact,\n  dog_fact: .dog.facts[0],\n}\n',
  },
  {
    name: 'EXIT' as ConfigNodeName,
    type: 'exit',
    inputs: {
      body: 'JOIN',
    } as Record<FieldName, NameConnection>,
    status: 200,
  },
  {
    name: 'DANGLING_CALL' as ConfigNodeName,
    type: 'call',
    url: 'https://dogapi.dog/api/v1/facts',
  },
  {
    name: 'READ_UPSTREAM' as ConfigNodeName,
    type: 'jq',
    input: 'service_response',
    jq: '.',
  },
], [])
</script>
