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
import english from '../../../../locales/en.json'
import { provideEditorStore } from '../composables'
import type { ConfigNodeName, FieldName, NameConnection, NodeName } from '../types'
import EditorModal from './modal/EditorModal.vue'

const { t } = createI18n<typeof english>('en-us', english)

defineProps<{
  editing: boolean
  config: any
}>()

// todo(zehao): mock data, remove later
// provideEditorStore(MockData.configNodes, MockData.uiNodes)

const { modalOpen } = provideEditorStore([
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
  {
    name: 'VALUE' as ConfigNodeName,
    type: 'static',
    values: {
      foo: 'bar',
      baz: null,
      nested: {
        key: 'value',
        array: [1, 2, 3],
      },
    },
    outputs: {
      foo: 'MY_CALL.body',
      baz: 'MY_CALL.headers',
    } as Record<FieldName, NameConnection>,
  },
  {
    name: 'MY_CALL' as ConfigNodeName,
    type: 'call',
    url: 'https://example.com/api',
  },
], [
  {
    name: 'VALUE' as NodeName,
    phase: 'response',
    position: { x: 0, y: 0 },
    fields: {
      output: ['foo', 'baz', 'nested', 'unknown'] as FieldName[],
    },
    expanded: {
      output: true,
    },
  },
])
</script>
