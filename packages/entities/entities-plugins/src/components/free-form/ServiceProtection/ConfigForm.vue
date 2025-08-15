<template>
  <Form
    class="rc-config-form"
    :config="formConfig"
    :data="data"
    :schema="schema"
    tag="div"
    @change="v => $emit('change', v)"
  >
    <ObjectField
      as-child
      name="config"
      reset-label-path="reset"
    >
      <RequestLimitsForm />
      <ErrorMessageForm />
    </ObjectField>

    <AdvancedFields>
      <Field name="config.dictionary_name" />
      <Field name="config.lock_dictionary_name" />
      <Field name="config.strategy" />
      <RedisField />
      <Field name="config.namespace" />
      <Field name="config.hide_client_headers" />
      <Field name="config.disable_penalty" />
      <Field name="config.retry_after_jitter_max" />
      <Field name="config.sync_rate" />
    </AdvancedFields>
  </Form>
</template>

<script setup lang="ts">
import Form from '../shared/Form.vue'
import Field from '../shared/Field.vue'
import ObjectField from '../shared/ObjectField.vue'
import RequestLimitsForm from './RequestLimitsForm.vue'
import ErrorMessageForm from './ErrorMessageForm.vue'
import AdvancedFields from '../shared/AdvancedFields.vue'
import RedisField from './RedisField.vue'

import type { FormConfig } from '../shared/types'
import type { FormSchema } from '../../../types/plugins/form-schema'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'

defineEmits<{
  (e: 'change', value: FreeFormPluginData): void
}>()

defineProps<{
  schema: FormSchema
  data?: FreeFormPluginData
}>()

const formConfig: FormConfig = {
  hasValue: (data?: FreeFormPluginData): boolean => !!data?.config,
}
</script>
