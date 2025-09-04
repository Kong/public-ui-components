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

    <EnumField
      name="content_type"
      @update:model-value="setConfig"
    />

    <PropertiesField
      :validators="fields"
      @update:model-value="handlePropertiesChange"
      @update:property-key="setConfig('property-key')"
    />

    <InputsField
      v-if="writable"
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import PropertiesField from './PropertiesField.vue'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import { computed, useTemplateRef } from 'vue'
import EnumField from '../../../shared/EnumField.vue'
import InputsField from './InputsField.vue'
import { extractKeyFromProperty, identifyPropertyHasKey, isReadableProperty, isWritableProperty } from '../node/property'
import { useEditorStore } from '../store/store'
import NameField from './NameField.vue'
import type { NodeId } from '../../types'
import { useFormValidation } from '../composables/validation'
import { notEmpty } from '../composables/validation'

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

interface PropertyFormData extends BaseFormData {
  property: string | null
  content_type: string | null
}

const formRef = useTemplateRef('form')
const { selectedNode, disconnectInEdges, disconnectOutEdges } = useEditorStore()

const schema = useSubSchema('property')

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
} = useNodeForm<PropertyFormData>(nodeId, () => formRef.value!.getInnerData())

const writable = computed(() => isWritableProperty(formData.value.property))

function handlePropertiesChange(value: string | null) {
  const nodeId = selectedNode.value?.id
  if (!nodeId) {
    // Assertion
    throw new Error('Expected selectedNode to be defined')
  }

  // If the property is not readable, disconnect all out-edges
  // associated with the node
  if (!isReadableProperty(value)) {
    disconnectOutEdges(nodeId, false)
  }

  // If the property is not writable, disconnect all in-edges
  // associated with the node
  if (!isWritableProperty(value)) {
    disconnectInEdges(nodeId, false)
  }

  setConfig()
}

const {
  fields,
} = useFormValidation({
  // Dynamic validation configuration - use function form
  validationConfig: () => ({
    property: notEmpty({ fieldName: 'Property' }),
    // Conditionally add key validation when property has key
    key: identifyPropertyHasKey(formData.value.property)
      ? notEmpty({ fieldName: 'Key' })
      : () => undefined, // No validation when not needed
  }),
  getValidationData: () => ({
    property: formData.value.property,
    key: extractKeyFromProperty(formData.value.property),
  }),
  toggleNodeValid,
})
</script>
