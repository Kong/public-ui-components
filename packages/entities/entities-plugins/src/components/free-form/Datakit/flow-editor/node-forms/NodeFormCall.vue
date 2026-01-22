<template>
  <Form
    ref="form"
    :data="formData"
    :schema="schema"
  >
    <NameField
      :name="formData.name"
      :validate="nameValidator"
      @update="setName"
    />

    <KLabel class="dk-node-configuration-label">
      {{ t('plugins.free-form.datakit.flow_editor.node_properties.configuration') }}
    </KLabel>

    <StringField
      :error="urlHandler.error"
      :error-message="urlHandler.errorMessage"
      name="url"
      @blur="urlHandler.validate"
      @update:model-value="urlHandler.update"
    />

    <HttpMethodField
      name="method"
      @update="setConfig()"
    />

    <NumberField
      :error="timeoutHandler.error"
      :error-message="timeoutHandler.errorMessage"
      name="timeout"
      @blur="timeoutHandler.validate"
      @update:model-value="timeoutHandler.update"
    />

    <StringField
      name="ssl_server_name"
      @update:model-value="setConfig('ssl_server_name')"
    />

    <BooleanField
      name="ssl_verify"
      @update:model-value="setConfig('ssl_verify')"
    />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      node-type="call"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import HttpMethodField from './HttpMethodField.vue'
import InputsField from './InputsField.vue'
import useI18n from '../../../../../composables/useI18n'
import NumberField from '../../../shared/NumberField.vue'
import BooleanField from '../../../shared/BooleanField.vue'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import StringField from '../../../shared/StringField.vue'
import { useTemplateRef } from 'vue'
import NameField from './NameField.vue'
import type { NodeId } from '../../types'
import { useFormValidation } from '../composables/validation'
import { notEmpty, compose, stringFormat, numberRange, numberFormat } from '../composables/validation'

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const { i18n: { t } } = useI18n()

const formRef = useTemplateRef('form')

const schema = useSubSchema('call')

interface CallFormData extends BaseFormData {
  url: string
  method?: string
  timeout?: number
  ssl_server_name?: string
  ssl_verify?: boolean
}

const {
  formData,
  setName,
  setConfig,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
  nameValidator,
  toggleNodeValid,
  fieldNameValidator,
} = useNodeForm<CallFormData>(nodeId, () => formRef.value!.getValue())

const {
  createFieldHandler,
} = useFormValidation({
  validationConfig: {
    url: compose(
      notEmpty({ fieldName: 'URL' }),
      stringFormat('url', { fieldName: 'URL' }),
    ),
    timeout: compose(
      numberFormat('integer'),
      numberRange(0, 2147483646),
    ),
  },
  getValidationData: () => ({
    url: formData.value.url,
    timeout: formData.value.timeout,
  }),
  toggleNodeValid,
})

// Create field handlers
const urlHandler = createFieldHandler('url', () => setConfig('url'))
const timeoutHandler = createFieldHandler('timeout', () => setConfig('timeout'))
</script>
