<template>
  <div class="dk-inputs-field-h1">
    {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.label') }}
  </div>

  <div class="dk-inputs-field-h2">
    {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.all') }}
  </div>

  <EnumField
    v-if="getSchema('input')"
    clearable
    enable-filtering
    :items="items"
    :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.source')"
    :label-attributes="{}"
    name="input"
    :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
    @change="handleInputChange"
  />

  <div class="dk-inputs-field-or">
    <span>
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.or') }}
    </span>
  </div>

  <div class="dk-inputs-field-h2">
    {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.individual') }}
  </div>

  <InputsField
    v-if="InputsField"
    :field-name-validator="fieldNameValidator"
    :items="items"
    :key-order="fieldNames"
    name="inputs"
    @add:field="handleAddField"
    @change:inputs="handleChangeInputs"
    @remove:field="handleRemoveField"
    @rename:field="handleRenameField"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useFormShared } from '../../../shared/composables'
import EnumField from '../../../shared/EnumField.vue'
import InputsRecordField from './InputsRecordField.vue'
import InputsMapField from './InputsMapField.vue'
import useI18n from '../../../../../composables/useI18n'
import type { InputOption, useNodeForm } from '../composables/useNodeForm'
import type { FieldName, IdConnection } from '../../types'

defineProps<{
  items: InputOption[]
  fieldNames: FieldName[]
  fieldNameValidator: ReturnType<typeof useNodeForm>['fieldNameValidator']
}>()

const emit = defineEmits<{
  'change:input': [value: IdConnection | null]
  'change:inputs': [name: FieldName, value: IdConnection | null]
  'add:field': [name: FieldName, value?: IdConnection | null]
  'remove:field': [name: FieldName]
  'rename:field': [oldName: FieldName, newName: FieldName]
}>()

const { getSchema } = useFormShared()
const { i18n } = useI18n()

const inputsSchema = computed(() => getSchema('inputs'))

const InputsField = computed(() => {
  if (!inputsSchema.value) return null
  return inputsSchema.value.type === 'record' ? InputsRecordField : InputsMapField
})

function handleInputChange(value: null | InputOption) {
  emit('change:input', value ? value.value : null)
}

function handleAddField(name: FieldName, value?: IdConnection | null) {
  emit('add:field', name, value)
}

function handleChangeInputs(name: FieldName, value: IdConnection | null) {
  emit('change:inputs', name, value)
}

function handleRemoveField(name: FieldName) {
  emit('remove:field', name)
}

function handleRenameField(oldName: FieldName, newName: FieldName) {
  emit('rename:field', oldName, newName)
}

</script>

<style lang="scss" scoped>
.dk-inputs-field-h1 {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-bold;
}

.dk-inputs-field-h2 {
  color: $kui-color-text;
  font-size: $kui-font-size-30;
  font-weight: $kui-font-weight-semibold
}

.dk-inputs-field-or {
  align-items: center;
  display: flex;
  height: $kui-icon-size-50;
  justify-content: center;
  position: relative;

  & > span {
    background-color: $kui-color-background;
    color: $kui-color-text-neutral;
    display: inline-flex;
    padding: 0 $kui-space-30;
    position: relative;
    text-transform: uppercase;
    user-select: none;
  }

  &::before {
    border-bottom: 1px solid $kui-color-border;
    content: ' ';
    display: block;
    height: 0px;
    position: absolute;
    width: 100%;
  }
}
</style>
