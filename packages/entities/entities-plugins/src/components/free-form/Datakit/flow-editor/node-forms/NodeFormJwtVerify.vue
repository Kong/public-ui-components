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
      multiple
      name="allowed_algorithms"
      @update="setConfig('allowed_algorithms')"
    />

    <ArrayField
      name="issuers"
      @add="setConfig('issuers')"
      @remove="setConfig('issuers')"
    >
      <template #item="{ fieldName, autofocus }">
        <StringField
          :autofocus="autofocus"
          :name="fieldName"
          @update:model-value="setConfig('issuers')"
        />
      </template>
    </ArrayField>

    <ArrayField
      name="audiences"
      @add="setConfig('audiences')"
      @remove="setConfig('audiences')"
    >
      <template #item="{ fieldName, autofocus }">
        <StringField
          :autofocus="autofocus"
          :name="fieldName"
          @update:model-value="setConfig('audiences')"
        />
      </template>
    </ArrayField>

    <ArrayField
      name="required_claims"
      @add="setConfig('required_claims')"
      @remove="setConfig('required_claims')"
    >
      <template #item="{ fieldName, autofocus }">
        <StringField
          :autofocus="autofocus"
          :name="fieldName"
          @update:model-value="setConfig('required_claims')"
        />
      </template>
    </ArrayField>

    <NumberField
      :error="leewayHandler.error"
      :error-message="leewayHandler.errorMessage"
      name="leeway"
      @blur="leewayHandler.validate"
      @update:model-value="leewayHandler.update"
    />

    <BooleanField
      name="validate_exp"
      @update:model-value="setConfig('validate_exp')"
    />

    <BooleanField
      name="validate_nbf"
      @update:model-value="setConfig('validate_nbf')"
    />

    <NodeFormDivider />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      node-type="jwt_verify"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { KLabel } from '@kong/kongponents'

import Form from '../../../shared/Form.vue'
import ArrayField from '../../../shared/ArrayField.vue'
import BooleanField from '../../../shared/BooleanField.vue'
import EnumField from '../../../shared/EnumField.vue'
import NumberField from '../../../shared/NumberField.vue'
import StringField from '../../../shared/StringField.vue'
import useI18n from '../../../../../composables/useI18n'
import type { IdConnection, NodeId } from '../../types'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import NodeFormDivider from './NodeFormDivider.vue'
import { compose, numberFormat, numberRange, useFormValidation } from '../composables/validation'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'

interface JwtVerifyFormData extends BaseFormData {
  allowed_algorithms?: string[] | null
  audiences?: string[] | null
  inputs?: BaseFormData['inputs'] & {
    key?: IdConnection | null
    token?: IdConnection | null
  }
  issuers?: string[] | null
  leeway?: number | null
  required_claims?: string[] | null
  validate_exp?: boolean
  validate_nbf?: boolean
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')
const schema = useSubSchema('jwt_verify')
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
} = useNodeForm<JwtVerifyFormData>(nodeId, () => formRef.value!.getValue())

const { createFieldHandler } = useFormValidation({
  validationConfig: {
    leeway: compose(
      numberFormat('integer', { fieldName: 'Leeway' }),
      numberRange(0, Infinity, { fieldName: 'Leeway' }),
    ),
  },
  getValidationData: () => ({
    leeway: formData.value.leeway,
  }),
  toggleNodeValid,
})

const leewayHandler = createFieldHandler('leeway', () => setConfig('leeway'))
</script>
