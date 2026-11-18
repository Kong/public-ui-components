<script setup lang="ts">
import { ref } from 'vue'
import Form from '../../components/Form.vue'
import { defineCelLanguage, kongConsumer, kongHttp } from '@kong-ui-public/monaco-editor/languages/cel'
import CelField from '../../components/CelField.vue'
import StringField from '../../components/StringField.vue'
import NumberField from '../../components/NumberField.vue'
import ArrayField from '../../components/ArrayField.vue'
import { schema } from './cel'

const props = defineProps<{
  enabled: boolean
  preopened?: boolean
  updateOnChange?: boolean
}>()

// The host supplies only language configuration; Freeform owns the real input.
const language = defineCelLanguage([kongHttp(), kongConsumer()])
const getSupportedLanguages = () => [language]

const data = {
  condition: '',
  config: { minute: 10, allow_when: [], deny_when: [] },
  ...(props.preopened && { expressions: { minute: '1' } }),
}
const payload = ref<Record<string, any>>(data)
</script>

<template>
  <Form
    :config="{ updateOnChange, celExpression: { enabled, getSupportedLanguages } }"
    :data="data"
    :schema="schema"
    @change="payload = $event"
  >
    <NumberField name="config.minute" />
    <component
      :is="enabled ? CelField : StringField"
      v-bind="enabled ? { language } : {}"
      name="condition"
    />
    <ArrayField
      v-for="name in ['allow_when', 'deny_when']"
      :key="name"
      :name="`config.${name}`"
    >
      <template #item="{ fieldName }">
        <component
          :is="enabled ? CelField : StringField"
          v-bind="enabled ? { language } : {}"
          multiline
          :name="fieldName"
        />
      </template>
    </ArrayField>
  </Form>
  <output data-testid="payload">{{ JSON.stringify(payload) }}</output>
</template>
