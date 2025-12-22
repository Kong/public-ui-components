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

    <BooleanField
      name="recognize_type"
      @update:model-value="setConfig('recognize_type')"
    />

    <StringField
      :error="attributesBlockHandler.error"
      :error-message="attributesBlockHandler.errorMessage"
      name="attributes_block_name"
      @blur="validateAttributes"
      @update:model-value="updateAttributesBlock"
    />

    <StringField
      :error="attributesPrefixHandler.error"
      :error-message="attributesPrefixHandler.errorMessage"
      name="attributes_name_prefix"
      @blur="validateAttributes"
      @update:model-value="updateAttributesPrefix"
    />

    <StringField
      :error="textBlockHandler.error"
      :error-message="textBlockHandler.errorMessage"
      name="text_block_name"
      @blur="textBlockHandler.validate"
      @update:model-value="textBlockHandler.update"
    />

    <BooleanField
      name="text_as_property"
      @update:model-value="setConfig('text_as_property')"
    />

    <StringField
      :error="xpathHandler.error"
      :error-message="xpathHandler.errorMessage"
      name="xpath"
      @blur="xpathHandler.validate"
      @update:model-value="xpathHandler.update"
    />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { KLabel } from '@kong/kongponents'

import Form from '../../../shared/Form.vue'
import BooleanField from '../../../shared/BooleanField.vue'
import StringField from '../../../shared/StringField.vue'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import {
  useNodeForm,
  useSubSchema,
  type BaseFormData,
} from '../composables/useNodeForm'
import { compose, stringLenRange, useFormValidation } from '../composables/validation'
import useI18n from '../../../../../composables/useI18n'
import type { NodeId } from '../../types'

interface XmlToJsonFormData extends BaseFormData {
  recognize_type?: boolean
  attributes_block_name?: string | null
  attributes_name_prefix?: string | null
  text_block_name?: string | null
  text_as_property?: boolean
  xpath?: string | null
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')
const schema = useSubSchema('xml_to_json')

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
} = useNodeForm<XmlToJsonFormData>(nodeId, () => formRef.value!.getValue())

console.log('schema', schema.value)
console.log('formData', formData.value)



const attributeError = t('plugins.free-form.datakit.flow_editor.node_properties.errors.attributes_required')

const hasAnyAttributeName = () => !!(formData.value.attributes_block_name || formData.value.attributes_name_prefix)

const { createFieldHandler } = useFormValidation({
  validationConfig: () => ({
    attributes_block_name: compose(
      () => (hasAnyAttributeName() ? undefined : attributeError),
      (value: string) => {
        if (value) {
          const validator = stringLenRange(1, 32, { fieldName: 'Attributes block name' })
          return validator(value)
        }
      },
    ),
    attributes_name_prefix: compose(
      () => (hasAnyAttributeName() ? undefined : attributeError),
      (value: string) => {
        if (value) {
          const validator = stringLenRange(1, 32, { fieldName: 'Attributes name prefix' })
          return validator(value)
        }
      },
    ),
    text_block_name: stringLenRange(1, 32, { fieldName: 'Text block name' }),
    xpath: stringLenRange(1, 256, { fieldName: 'XPath' }),
  }),
  getValidationData: () => ({
    attributes_block_name: formData.value.attributes_block_name,
    attributes_name_prefix: formData.value.attributes_name_prefix,
    text_block_name: formData.value.text_block_name,
    xpath: formData.value.xpath,
  }),
  toggleNodeValid,
})

const attributesBlockHandler = createFieldHandler('attributes_block_name', () => setConfig('attributes_block_name'))
const attributesPrefixHandler = createFieldHandler('attributes_name_prefix', () => setConfig('attributes_name_prefix'))
const textBlockHandler = createFieldHandler('text_block_name', () => setConfig('text_block_name'))
const xpathHandler = createFieldHandler('xpath', () => setConfig('xpath'))

const validateAttributes = () => {
  attributesBlockHandler.value.validate()
  attributesPrefixHandler.value.validate()
}

const updateAttributesBlock = () => {
  attributesBlockHandler.value.update()
  attributesPrefixHandler.value.validate()
}

const updateAttributesPrefix = () => {
  attributesPrefixHandler.value.update()
  attributesBlockHandler.value.validate()
}
</script>
