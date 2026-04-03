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

    <EnumField
      enable-filtering
      name="algorithm"
      @update="algorithmHandler.update"
    />

    <NumberField
      :error="expiresInHandler.error"
      :error-message="expiresInHandler.errorMessage"
      name="expires_in"
      @blur="expiresInHandler.validate"
      @update:model-value="expiresInHandler.update"
    />

    <NumberField
      :error="notBeforeHandler.error"
      :error-message="notBeforeHandler.errorMessage"
      name="not_before"
      @blur="notBeforeHandler.validate"
      @update:model-value="notBeforeHandler.update"
    />

    <StringField
      name="kid"
      @update:model-value="setConfig('kid')"
    />

    <StringField
      name="typ"
      @update:model-value="setConfig('typ')"
    />

    <KeyValueField
      :label="t('plugins.free-form.datakit.flow_editor.node_properties.jwt.static_claims.label')"
      name="static_claims"
      @change="setConfig('static_claims')"
    />

    <NodeFormDivider />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      node-type="jwt_sign"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { KLabel } from '@kong/kongponents'

import Form from '../../../../shared/Form.vue'
import EnumField from '../../../../shared/EnumField.vue'
import KeyValueField from '../../../../shared/KeyValueField.vue'
import NumberField from '../../../../shared/NumberField.vue'
import StringField from '../../../../shared/StringField.vue'
import useI18n from '../../../../../../composables/useI18n'
import type { IdConnection, NodeId } from '../../types'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import NodeFormDivider from './NodeFormDivider.vue'
import { compose, notEmpty, numberFormat, numberRange, useFormValidation } from '../composables/validation'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'

interface JwtSignFormData extends BaseFormData {
  algorithm?: string | null
  expires_in?: number | null
  inputs?: BaseFormData['inputs'] & {
    claims?: IdConnection | null
    key?: IdConnection | null
  }
  kid?: string | null
  not_before?: number | null
  static_claims?: Record<string, string> | null
  typ?: string | null
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')
const schema = useSubSchema('jwt_sign')
const {
  i18n: { t },
} = useI18n()

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
} = useNodeForm<JwtSignFormData>(nodeId, () => {
  const next = { ...formRef.value!.getValue() }
  if (!next.static_claims || Object.keys(next.static_claims).length === 0) {
    delete next.static_claims
  }
  return next
})

const { createFieldHandler } = useFormValidation({
  validationConfig: {
    algorithm: notEmpty({ fieldName: 'Algorithm' }),
    expires_in: compose(
      numberFormat('integer', { fieldName: 'Expires in' }),
      numberRange(1, Infinity, { fieldName: 'Expires in' }),
    ),
    not_before: compose(
      numberFormat('integer', { fieldName: 'Not before' }),
      numberRange(0, Infinity, { fieldName: 'Not before' }),
    ),
  },
  getValidationData: () => ({
    algorithm: formData.value.algorithm,
    expires_in: formData.value.expires_in,
    not_before: formData.value.not_before,
  }),
  toggleNodeValid,
})

const algorithmHandler = createFieldHandler('algorithm', () => setConfig('algorithm'))
const expiresInHandler = createFieldHandler('expires_in', () => setConfig('expires_in'))
const notBeforeHandler = createFieldHandler('not_before', () => setConfig('not_before'))
</script>
