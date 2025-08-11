<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="StaticNodeSchema"
  >
    <StringField
      name="name"
      @update:model-value="setName"
    />

    <OutputValueField
      :key-order="outputsFieldNames"
      name="values"
      @add:field="handleAddField"
      @change:value="handleChangeValue"
      @remove:field="handleRemoveField"
      @rename:field="handleRenameField"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import OutputValueField from './OutputValueField.vue'
import { StaticNodeSchema } from '../node/schemas'
import { computed } from 'vue'
import type { FieldName, NodeName } from '../../types'
import { useEditorStore } from '../../composables'
import StringField from '../../../shared/StringField.vue'
import { findFieldById, findFieldByName } from '../store/helpers'
import { fieldValueToStoreValue, renameKeyAndKeepOrder, storeValueToFieldValue, type StoreValue } from '../node/static'

const {
  renameNode,
  selectedNode,
  getOutEdgesByNodeId,
  addField,
  renameField,
  removeField,
  replaceConfig,
} = useEditorStore()

const outputsFieldNames = computed<FieldName[]>(() => {
  return selectedNode.value?.fields.output.map(f => f.name) || []
})

function setName(name: string | null) {
  if (!selectedNode.value) throw new Error('No selected node')
  renameNode(selectedNode.value.id, name as NodeName ?? '')
}

const formData = computed(() => {
  if (!selectedNode.value) {
    return {}
  }

  const values = (selectedNode.value.config?.values ?? {}) as StoreValue
  const nextValues = {} as StoreValue

  // gather fieldNames from edges
  const outputsFieldNamesFromEdges = getOutEdgesByNodeId(selectedNode.value.id)
    .map(edge => edge.sourceField)
    .filter(Boolean)
    .map(fieldId => findFieldById(selectedNode.value!, 'output', fieldId))
    .map(nodeField => nodeField?.name)
    .filter(Boolean) as FieldName[]

  // gather fieldNames from fields
  const outputsFieldNamesFromFields = selectedNode.value!.fields.output.map(field => field.name)

  // combine fieldNames
  const outputsFieldNames = new Set([
    ...outputsFieldNamesFromEdges,
    ...outputsFieldNamesFromFields,
  ])

  // append key for `values`
  outputsFieldNames.forEach(name => {
    if (name in values) {
      nextValues[name] = values[name]
      return
    }
    nextValues[name] = ''
  })

  return {
    name: selectedNode.value.name,
    values: storeValueToFieldValue(nextValues),
  }
})

function handleAddField(name: FieldName, value?: string) {
  if (!selectedNode.value) throw new Error('No selected node')
  addField(selectedNode.value.id, 'output', name, !value)
  if (value) {
    const next = {
      values: fieldValueToStoreValue({ ...formData.value.values, [name]: value }),
    }
    replaceConfig(selectedNode.value.id, next)
  }
}

function handleRenameField(oldName: FieldName, newName: FieldName) {
  if (!selectedNode.value) throw new Error('No selected node')
  const field = findFieldByName(selectedNode.value, 'output', oldName)
  if (!field) throw new Error('No field found to rename')
  const next = {
    values: fieldValueToStoreValue(renameKeyAndKeepOrder(formData.value.values ?? {}, oldName, newName)),
  }
  replaceConfig(selectedNode.value.id, next, false)
  renameField(selectedNode.value.id, field.id, newName)
}

function handleRemoveField(name: FieldName) {
  if (!selectedNode.value) throw new Error('No selected node')
  const field = findFieldByName(selectedNode.value, 'output', name)
  if (!field) throw new Error('No field found to delete')
  removeField(selectedNode.value?.id, field.id, true, false)
  const next = {
    values: fieldValueToStoreValue({ ...formData.value.values }),
  }
  delete next.values[name]
  replaceConfig(selectedNode.value.id, next)
}

function handleChangeValue(name: FieldName, value: string) {
  if (!selectedNode.value) throw new Error('No selected node')
  const nextValues = { ...formData.value.values }
  nextValues[name] = value
  const next = {
    values: fieldValueToStoreValue(nextValues),
  }
  replaceConfig(selectedNode.value.id, next)
}
</script>
