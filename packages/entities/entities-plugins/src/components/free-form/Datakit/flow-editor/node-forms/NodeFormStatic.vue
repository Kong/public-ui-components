<template>
  <Form
    ref="form"
    :data="formData"
    :schema="schema"
  >
    <NameField
      :name="currentNode?.name ?? ''"
      :validate="nameValidator"
      @update="setName"
    />

    <OutputValueField
      :field-name-validator="fieldNameValidator"
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
import { computed } from 'vue'
import type { FieldName, NodeName } from '../../types'
import { useEditorStore } from '../../composables'
import { findFieldById, findFieldByName } from '../store/helpers'
import { fieldValueToStoreValue, renameKeyAndKeepOrder, storeValueToFieldValue, type StoreValue } from '../node/static'
import { useNodeForm, useSubSchema } from '../composables/useNodeForm'
import { useNodeNameValidator } from '../composables/validation'
import type { NodeId } from '../../types'
import NameField from './NameField.vue'

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const {
  renameNode,
  getOutEdgesByNodeId,
  addField,
  renameField,
  removeField,
  replaceConfig,
  getNodeById,
} = useEditorStore()

const { fieldNameValidator } = useNodeForm(nodeId)

const schema = useSubSchema('static')
const nameValidator = useNodeNameValidator(nodeId)

const currentNode = computed(() => getNodeById(nodeId))

const outputsFieldNames = computed<FieldName[]>(() => {
  return currentNode.value?.fields.output.map(f => f.name) || []
})

function setName(name: string | null) {
  if (!currentNode.value) throw new Error('No current node')
  renameNode(currentNode.value.id, name as NodeName ?? '')
}

const formData = computed(() => {
  if (!currentNode.value) {
    return {}
  }

  const values = (currentNode.value.config?.values ?? {}) as StoreValue
  const nextValues = {} as StoreValue

  // gather fieldNames from edges
  const outputsFieldNamesFromEdges = getOutEdgesByNodeId(currentNode.value.id)
    .map(edge => edge.sourceField)
    .filter(Boolean)
    .map(fieldId => findFieldById(currentNode.value!, 'output', fieldId))
    .map(nodeField => nodeField?.name)
    .filter(Boolean) as FieldName[]

  // gather fieldNames from fields
  const outputsFieldNamesFromFields = currentNode.value!.fields.output.map(field => field.name)

  // gather fieldNames from values
  const outputsFieldNamesFromValues = Object.keys(values)

  // combine fieldNames
  const outputsFieldNames = new Set([
    ...outputsFieldNamesFromValues,
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
    name: currentNode.value.name,
    values: storeValueToFieldValue(nextValues),
  }
})

function handleAddField(name: FieldName, value?: string) {
  if (!currentNode.value) throw new Error('No selected node')
  const hasValue = value !== undefined
  addField(nodeId, 'output', name, !hasValue)
  if (hasValue) {
    const next = {
      values: fieldValueToStoreValue({ ...formData.value.values, [name]: value }),
    }
    replaceConfig(nodeId, next)
  }
}

function handleRenameField(oldName: FieldName, newName: FieldName) {
  if (!currentNode.value) throw new Error('No selected node')
  const field = findFieldByName(currentNode.value, 'output', oldName)
  if (!field) throw new Error('No field found to rename')
  const next = {
    values: fieldValueToStoreValue(renameKeyAndKeepOrder(formData.value.values ?? {}, oldName, newName)),
  }
  replaceConfig(nodeId, next, false)
  renameField(nodeId, field.id, newName)
}

function handleRemoveField(name: FieldName) {
  if (!currentNode.value) throw new Error('No selected node')
  const field = findFieldByName(currentNode.value, 'output', name)
  if (!field) throw new Error('No field found to delete')
  removeField(currentNode.value?.id, field.id, true, false)
  const next = {
    values: fieldValueToStoreValue({ ...formData.value.values }),
  }
  delete next.values[name]
  replaceConfig(nodeId, next)
}

function handleChangeValue(name: FieldName, value: string) {
  if (!currentNode.value) throw new Error('No selected node')
  const nextValues = { ...formData.value.values }
  nextValues[name] = value
  const next = {
    values: fieldValueToStoreValue(nextValues),
  }
  replaceConfig(nodeId, next)
}
</script>
