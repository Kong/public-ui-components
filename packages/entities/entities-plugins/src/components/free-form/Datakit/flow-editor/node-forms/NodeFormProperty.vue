<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
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

    <PropertiesField @update:model-value="handlePropertiesChange" />

    <InputsField
      v-if="writable"
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
import { isReadableProperty, isWritableProperty } from '../node/property'
import { useEditorStore } from '../store/store'
import NameField from './NameField.vue'

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
} = useNodeForm<PropertyFormData>(() => formRef.value!.getInnerData())

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
</script>
