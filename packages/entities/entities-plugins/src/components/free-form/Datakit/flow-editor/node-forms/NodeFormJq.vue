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

    <!-- todo(zehao): replace to monaco editor -->
    <StringField
      autosize
      :error="jqHandler.error"
      :error-message="jqHandler.errorMessage"
      :label="jqFieldName"
      :label-attributes="{}"
      multiline
      name="jq"
      resizable
      @blur="jqHandler.validate"
      @update:model-value="jqHandler.update"
    >
      <template #help>
        <i18nT keypath="plugins.free-form.datakit.flow_editor.node_properties.jq.help">
          <template #link>
            <KExternalLink
              hide-icon
              :href="externalLinks.jqlang"
            >
              {{ externalLinks.jqlang }}
            </KExternalLink>
          </template>
        </i18nT>
      </template>
    </StringField>

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
import Form from '../../../shared/Form.vue'
import InputsField from './InputsField.vue'
import useI18n from '../../../../../composables/useI18n'
import StringField from '../../../shared/StringField.vue'
import { useTemplateRef } from 'vue'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import type { FieldName, IdConnection } from '../../types'
import NameField from './NameField.vue'
import type { NodeId } from '../../types'
import { useFormValidation } from '../composables/validation'
import { compose, notEmpty, stringLenRange } from '../composables/validation'
import externalLinks from '../../../../../external-links'

interface JqFormData extends BaseFormData {
  jq: string
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const { i18n: { t }, i18nT } = useI18n()

const formRef = useTemplateRef('form')

const schema = useSubSchema('jq')

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
} = useNodeForm<JqFormData>(nodeId, () => formRef.value!.getValue())

function handleAddField(name: FieldName, value?: IdConnection | null) {
  addField('input', name, value)
}

function handleRemoveField(name: FieldName) {
  removeFieldByName('input', name)
}

function handleRenameField(oldName: FieldName, newName: FieldName) {
  renameFieldByName('input', oldName, newName)
}

const jqFieldName = t('plugins.free-form.datakit.flow_editor.node_properties.jq.label')

const {
  createFieldHandler,
} = useFormValidation({
  validationConfig: {
    jq: compose(
      notEmpty({ fieldName: jqFieldName }),
      stringLenRange(1, 10240, { fieldName: jqFieldName }),
    ),
  },
  getValidationData: () => ({
    jq: formData.value.jq,
  }),
  toggleNodeValid,
})

// Create field handlers
const jqHandler = createFieldHandler('jq', () => setConfig('jq'))
</script>
