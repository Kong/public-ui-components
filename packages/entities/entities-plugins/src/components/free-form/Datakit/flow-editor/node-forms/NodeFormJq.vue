<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="JqNodeSchema"
  >
    <StringField
      name="name"
      @update:model-value="setName"
    />

    <KLabel class="dk-node-configuration-label">
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.Configuration') }}
    </KLabel>

    <!-- todo(zehao): replace to monaco editor -->
    <StringField
      :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.jq.label')"
      multiline
      name="jq"
      resizable
      rows="2"
      @update:model-value="setConfig()"
    />

    <InputsField
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
import Form from '../../../shared/Form.vue'
import InputsField from './InputsField.vue'
import { JqNodeSchema } from '../node/schemas'
import useI18n from '../../../../../composables/useI18n'
import StringField from '../../../shared/StringField.vue'
import { useTemplateRef } from 'vue'
import { useNodeForm } from './composables'
import type { FieldName, IdConnection } from '../../types'

const { i18n } = useI18n()

const formRef = useTemplateRef('form')

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
} = useNodeForm(() => formRef.value!.getInnerData())

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
