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

    <!-- Only available on gateways that support it -->
    <ArrayField
      v-if="supportsForceArrayPaths"
      name="force_array_paths"
      @add="setConfig('force_array_paths')"
      @remove="removeForceArrayPath"
    >
      <template #item="{ fieldName, index, autofocus }">
        <StringField
          :autofocus="autofocus"
          :error="!!forceArrayPathErrors[index]"
          :error-message="forceArrayPathErrors[index]"
          :name="fieldName"
          :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.xml_to_json.force_array_paths.placeholder')"
          @blur="validateForceArrayPath(index)"
          @update:model-value="updateForceArrayPath(index)"
        />
      </template>
    </ArrayField>

    <NodeFormDivider />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      node-type="xml_to_json"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue'
import { KLabel } from '@kong/kongponents'

import { Form, ArrayField, BooleanField, StringField } from '@kong-ui-public/freeform'
import InputsField from './InputsField.vue'
import NameField from './NameField.vue'
import NodeFormDivider from './NodeFormDivider.vue'
import {
  useNodeForm,
  useSubSchema,
} from '../composables/useNodeForm'
import { compose, stringLenRange, useFormValidation } from '../composables/validation'
import useI18n from '../../../../../../composables/useI18n'
import { isValidForceArrayPath } from '../../schema/strict'
import type { RecordFieldSchema } from '@kong-ui-public/freeform'
import type { BaseFormData } from '../composables/useNodeForm'
import type { NodeId } from '../../types'

interface XmlToJsonFormData extends BaseFormData {
  recognize_type?: boolean
  attributes_block_name?: string | null
  attributes_name_prefix?: string | null
  text_block_name?: string | null
  text_as_property?: boolean
  xpath?: string | null
  force_array_paths?: string[] | null
}

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const formRef = useTemplateRef('form')
const schema = useSubSchema('xml_to_json')
const supportsForceArrayPaths = computed(() => (schema.value as RecordFieldSchema).fields.some((field) => 'force_array_paths' in field))

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

const attributeError = t('plugins.free-form.datakit.flow_editor.node_properties.errors.attributes_required')

const forceArrayPathError = (path?: string | null) =>
  path && isValidForceArrayPath(path)
    ? ''
    : t('plugins.free-form.datakit.flow_editor.node_properties.errors.invalid_force_array_path')

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
    force_array_paths: (paths?: string[] | null) => paths?.map(forceArrayPathError).find(Boolean),
  }),
  getValidationData: () => ({
    attributes_block_name: formData.value.attributes_block_name,
    attributes_name_prefix: formData.value.attributes_name_prefix,
    text_block_name: formData.value.text_block_name,
    xpath: formData.value.xpath,
    force_array_paths: formData.value.force_array_paths,
  }),
  toggleNodeValid,
})

const attributesBlockHandler = createFieldHandler('attributes_block_name', () => setConfig('attributes_block_name'))
const attributesPrefixHandler = createFieldHandler('attributes_name_prefix', () => setConfig('attributes_name_prefix'))
const textBlockHandler = createFieldHandler('text_block_name', () => setConfig('text_block_name'))
const xpathHandler = createFieldHandler('xpath', () => setConfig('xpath'))
const forceArrayPathsHandler = createFieldHandler('force_array_paths', () => setConfig('force_array_paths'))

// Errors of the paths the user has touched, keyed by item index
const forceArrayPathErrors = ref<Record<number, string>>({})

// Surface every invalid path once the whole field has been validated with errors,
// so a node marked invalid always shows why
const syncForceArrayPathErrors = () => {
  if (!forceArrayPathsHandler.value.error) return
  formData.value.force_array_paths?.forEach((_, index) => setForceArrayPathError(index))
}

const setForceArrayPathError = (index: number) => {
  forceArrayPathErrors.value[index] = forceArrayPathError(formData.value.force_array_paths?.[index])
}

const validateForceArrayPath = (index: number) => {
  forceArrayPathsHandler.value.validate()
  setForceArrayPathError(index)
}

const updateForceArrayPath = (index: number) => {
  forceArrayPathsHandler.value.update()
  setForceArrayPathError(index)
}

const removeForceArrayPath = (removed: number) => {
  // Keep the errors aligned with the remaining items
  forceArrayPathErrors.value = Object.fromEntries(
    Object.entries(forceArrayPathErrors.value)
      .filter(([index]) => Number(index) !== removed)
      .map(([index, error]) => [Number(index) > removed ? Number(index) - 1 : Number(index), error]),
  )
  forceArrayPathsHandler.value.update()
  syncForceArrayPathErrors()
}

// Runs after the mount-time validation of `useFormValidation`, which honors `skipValidation`
onMounted(syncForceArrayPathErrors)

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
