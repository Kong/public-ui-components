<script setup lang="ts">
import { provide, ref } from 'vue'
import Form from '../../components/Form.vue'
import Field from '../../components/Field.vue'
import CelField from '../../components/CelField.vue'
import StringField from '../../components/StringField.vue'
import NumberField from '../../components/NumberField.vue'
import ArrayField from '../../components/ArrayField.vue'
import { CEL_INPUT_KEY } from '../../constants'
import { language, schema } from './cel'

const props = defineProps<{
  enabled: boolean
  preopened?: boolean
  updateOnChange?: boolean
}>()

// The host supplies only language configuration; Freeform owns the real input.
provide(CEL_INPUT_KEY, () => props.enabled ? { language } : undefined)

const data = {
  condition: '',
  config: { minute: 10, allow_when: [], deny_when: [] },
  ...(props.preopened && { expressions: { minute: '1' } }),
}
const payload = ref<Record<string, any>>(data)
</script>

<template>
  <Form
    :config="{ updateOnChange }"
    :data="data"
    :schema="schema"
    @change="payload = $event"
  >
    <Field name="rule" />
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
