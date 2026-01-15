<template>
  <KLabel
    class="dk-inputs-field-h1"
    :info="t('plugins.free-form.datakit.flow_editor.node_properties.input.tooltip')"
  >
    {{ t('plugins.free-form.datakit.flow_editor.node_properties.input.label') }}
  </KLabel>

  <EnumField
    v-if="getSchema('input')"
    class="dk-inputs-field-h2"
    clearable
    enable-filtering
    :items="items"
    :label="t('plugins.free-form.datakit.flow_editor.node_properties.input.input')"
    :label-attributes="{
      info: undefined,
    }"
    name="input"
    :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
    @change="handleInputChange"
  >
    <template #item-label="item">
      <slot
        name="item-label"
        v-bind="item"
      >
        <SourceItem :item="item" />
      </slot>
    </template>
  </EnumField>

  <div
    v-if="InputsField"
    class="dk-inputs-field-or"
  >
    <span>
      {{ t('plugins.free-form.datakit.flow_editor.node_properties.input.or') }}
    </span>
  </div>

  <KLabel
    v-if="InputsField"
    class="dk-inputs-field-h2 dk-margin-0"
  >
    {{ t('plugins.free-form.datakit.flow_editor.node_properties.input.fields') }}
  </KLabel>

  <InputsField
    v-if="InputsField"
    :items="items"
    :key-order="fieldNames"
    name="inputs"
    v-bind="InputsField === InputsRecordField ? { nodeType } : { fieldNameValidator }"
    @add:field="handleAddField"
    @change:inputs="handleChangeInputs"
    @remove:field="handleRemoveField"
    @rename:field="handleRenameField"
  >
    <template #item-label="item">
      <SourceItem :item="item" />
    </template>
  </InputsField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KLabel } from '@kong/kongponents'
import { useFormShared } from '../../../shared/composables'
import EnumField from '../../../shared/EnumField.vue'
import InputsRecordField from './InputsRecordField.vue'
import InputsMapField from './InputsMapField.vue'
import useI18n from '../../../../../composables/useI18n'
import type { InputOption, useNodeForm } from '../composables/useNodeForm'
import type { FieldName, IdConnection, NodeType } from '../../types'
import SourceItem from './SourceItem.vue'

defineProps<{
  items: InputOption[]
  fieldNames: FieldName[]
  fieldNameValidator: ReturnType<typeof useNodeForm>['fieldNameValidator']
  nodeType: NodeType
}>()

const emit = defineEmits<{
  'change:input': [value: IdConnection | null]
  'change:inputs': [name: FieldName, value: IdConnection | null]
  'add:field': [name: FieldName, value?: IdConnection | null]
  'remove:field': [name: FieldName]
  'rename:field': [oldName: FieldName, newName: FieldName]
}>()

const { getSchema } = useFormShared()
const { i18n: { t } } = useI18n()

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
  margin-bottom: 0;
}

.dk-inputs-field-h2,
.dk-inputs-field-h2 > :deep(.k-label) {
  color: $kui-color-text;
  font-size: $kui-font-size-40;
  font-weight: $kui-font-weight-semibold;
}

.dk-margin-0 {
  margin: 0;
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
