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
      :error="rootElementHandler.error"
      :error-message="rootElementHandler.errorMessage"
      name="root_element_name"
      @blur="rootElementHandler.validate"
      @update:model-value="rootElementHandler.update"
    />

    <StringField
      :error="textBlockHandler.error"
      :error-message="textBlockHandler.errorMessage"
      name="text_block_name"
      @blur="textBlockHandler.validate"
      @update:model-value="textBlockHandler.update"
    />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      @add:field="handleAddField"
      @change:input="setInput"
      @change:inputs="setInputs"
      @remove:field="handleRemoveField"
      @rename:field="handleRenameField"
    />
  </Form>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { KLabel } from '@kong/kongponents'

import Form from '../../../shared/Form.vue'
import StringField from '../../../shared/StringField.vue'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import {
  useNodeForm,
  useSubSchema,
} from '../composables/useNodeForm'
import { compose, stringLenRange, useFormValidation } from '../composables/validation'
import useI18n from '../../../../../composables/useI18n'
import type { BaseFormData } from '../composables/useNodeForm'
import type { FieldName, IdConnection, NodeId } from '../../types'

interface JsonToXmlFormData extends BaseFormData {
  attributes_block_name?: string | null
  attributes_name_prefix?: string | null
  root_element_name?: string | null
  text_block_name?: string | null
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')
const schema = useSubSchema('json_to_xml')

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
  addField,
  removeFieldByName,
  renameFieldByName,
  inputsFieldNames,
  nameValidator,
  toggleNodeValid,
  fieldNameValidator,
} = useNodeForm<JsonToXmlFormData>(nodeId, () => formRef.value!.getValue())

const attributeError = t('plugins.free-form.datakit.flow_editor.node_properties.errors.attributes_required')

const hasAnyAttributeName = () => !!(formData.value.attributes_block_name || formData.value.attributes_name_prefix)

const { createFieldHandler } = useFormValidation({
  validationConfig: {
    attributes_block_name: compose(
      () => (hasAnyAttributeName() ? undefined : attributeError),
      stringLenRange(1, 32, { fieldName: 'Attributes block name' }),
    ),
    attributes_name_prefix: compose(
      () => (hasAnyAttributeName() ? undefined : attributeError),
      stringLenRange(1, 32, { fieldName: 'Attributes name prefix' }),
    ),
    root_element_name: stringLenRange(1, 64, { fieldName: 'Root element name' }),
    text_block_name: stringLenRange(1, 32, { fieldName: 'Text block name' }),
  },
  getValidationData: () => ({
    attributes_block_name: formData.value.attributes_block_name,
    attributes_name_prefix: formData.value.attributes_name_prefix,
    root_element_name: formData.value.root_element_name,
    text_block_name: formData.value.text_block_name,
  }),
  toggleNodeValid,
})

const attributesBlockHandler = createFieldHandler('attributes_block_name', () => setConfig('attributes_block_name'))
const attributesPrefixHandler = createFieldHandler('attributes_name_prefix', () => setConfig('attributes_name_prefix'))
const rootElementHandler = createFieldHandler('root_element_name', () => setConfig('root_element_name'))
const textBlockHandler = createFieldHandler('text_block_name', () => setConfig('text_block_name'))

function validateAttributes() {
  attributesBlockHandler.value.validate()
  attributesPrefixHandler.value.validate()
}

function updateAttributesBlock() {
  attributesBlockHandler.value.update()
  attributesPrefixHandler.value.validate()
}

function updateAttributesPrefix() {
  attributesPrefixHandler.value.update()
  attributesBlockHandler.value.validate()
}

function handleAddField(name: FieldName, value?: IdConnection | null) {
  addField('input', name, value)
}

function handleRemoveField(name: FieldName) {
  removeFieldByName('input', name)
}

function handleRenameField(oldName: FieldName, newName: FieldName) {
  renameFieldByName('input', oldName, newName)
}
</script>
