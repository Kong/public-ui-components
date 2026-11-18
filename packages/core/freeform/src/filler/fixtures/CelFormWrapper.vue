<script setup lang="ts">
import { h, ref, type FunctionalComponent } from 'vue'
import Form from '../../components/Form.vue'
import { defineCelKind, kongConsumer, kongHttp } from '@kong-ui-public/monaco-editor/languages/cel'
import CelField from '../../components/CelField.vue'
import StringField from '../../components/StringField.vue'
import NumberField from '../../components/NumberField.vue'
import FieldRenderer from '../../components/FieldRenderer.vue'
import { FIELD_RENDERERS, isExpressionFieldSchema } from '../../composables'
import ArrayField from '../../components/ArrayField.vue'
import { schema } from './cel'

const props = defineProps<{
  enabled: boolean
  preopened?: boolean
  updateOnChange?: boolean
}>()

// The host supplies only the CEL kind; Freeform owns the real input.
const kind = defineCelKind([kongHttp(), kongConsumer()])
const ExpressionInput: FunctionalComponent<{ name: string }> = (attrs, { slots }) =>
  props.enabled ? h(CelField, { ...attrs, kind }, slots) : h(StringField, attrs, slots)
ExpressionInput.inheritAttrs = false

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
    <template #[FIELD_RENDERERS]>
      <FieldRenderer
        :component="ExpressionInput"
        :match="({ schema: field }) => isExpressionFieldSchema(field)"
      />
    </template>
    <NumberField name="config.minute" />
    <component
      :is="enabled ? CelField : StringField"
      v-bind="enabled ? { kind } : {}"
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
          v-bind="enabled ? { kind } : {}"
          multiline
          :name="fieldName"
        />
      </template>
    </ArrayField>
  </Form>
  <output data-testid="payload">{{ JSON.stringify(payload) }}</output>
</template>
