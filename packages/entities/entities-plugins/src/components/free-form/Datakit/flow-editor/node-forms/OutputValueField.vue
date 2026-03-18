<template>
  <!-- missing schema alert -->
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />

  <div
    v-else
    ref="root"
    class="dk-output-value-field"
  >
    <KLabel class="dk-node-configuration-label">
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.label') }}
    </KLabel>

    <KCard
      v-for="(entry, index) of entries"
      :key="entry.id"
      class="dk-output-value-field-entry"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <template #actions>
        <KButton
          appearance="none"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          icon
          @click="handleRemoveEntry(entry)"
        >
          <CloseIcon />
        </KButton>
      </template>
      <KInput
        :id="`ff-kv-entry-key-${field.path.value}.${index}`"
        class="ff-kv-field-entry-key"
        :data-key-input="index"
        :data-testid="`ff-key-${field.path.value}.${index}`"
        :error="errorMap.has(entry.id)"
        :error-message="errorMap.get(entry.id)"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value_name')"
        :model-value="entry.key"
        required
        @blur="handleOutputsNameBlur(entry)"
        @change="handleOutputsNameChange(entry)"
        @focus="handleBeforeOutputsNameChange(entry)"
        @update:model-value="v => handleKeyInput(entry.id, v)"
      />
      <KInput
        class="ff-kv-field-entry-value"
        :data-testid="`ff-value-${field.path.value}.${index}`"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value')"
        :model-value="(entry.value as string)"
        @change="handleOutputsValueChange($event, entry)"
        @update:model-value="v => updateValue(entry.id, v.trim())"
      />
    </KCard>

    <KButton
      appearance="tertiary"
      :data-testid="`ff-kv-add-btn-${field.path.value}`"
      :disabled="!!addingEntryId"
      @click="handleAddEntry"
    >
      <AddIcon />
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.add_button') }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, nextTick, ref } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import useI18n from '../../../../../composables/useI18n'
import type { FieldName } from '../../types'
import { useKeyValueField, type KeyValueFieldEmits, type KeyValueFieldProps, type KVEntry } from '../../../shared/headless/useKeyValueField'
import type { KeyId } from '../../../shared/composables/kv'
import type { useNodeForm } from '../composables/useNodeForm'

interface Props extends KeyValueFieldProps<string> {
  fieldNameValidator: ReturnType<typeof useNodeForm>['fieldNameValidator']
}

interface Emits extends KeyValueFieldEmits {
  'change:value': [name: FieldName, value: string]
  'add:field': [name: FieldName, value?: string]
  'rename:field': [name: FieldName, newName: FieldName]
  'remove:field': [name: FieldName]
}

type Entry = KVEntry<string>

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const errorMap = ref(new WeakMap<KeyId, string>())

const {
  entries,
  addEntry,
  removeEntry,
  updateKey,
  updateValue,
  field,
} = useKeyValueField(props, emit)

const { i18n } = useI18n()
const root = useTemplateRef('root')
const addingEntryId = ref<KeyId | null>(null)

let fieldNameBeforeChange: FieldName

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function getEntry(id: KeyId): Entry | undefined {
  return entries.value.find(e => e.id === id)
}

function handleAddEntry() {
  const id = addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)

  addingEntryId.value = id
}

function handleRemoveEntry(entry: Entry) {
  if (entry.id === addingEntryId.value) {
    addingEntryId.value = null
  }
  removeEntry(entry.id)
  if (entry.key.trim() !== '') { // only emit remove if the field has a name
    emit('remove:field', entry.key as FieldName)
  }
}

function handleBeforeOutputsNameChange(entry: Entry) {
  fieldNameBeforeChange = entry.key as FieldName
}

function handleKeyInput(id: KeyId, value: string) {
  updateKey(id, value.trim())
  const entry = getEntry(id)
  if (entry) validateFieldName(entry)
}

function handleOutputsNameChange(entry: Entry) {
  // Reset the value if the field name is invalid
  if (validateFieldName(entry)) {
    updateKey(entry.id, fieldNameBeforeChange)
    errorMap.value.delete(entry.id)
    return
  }

  if (entry.id === addingEntryId.value) {
    // add field
    if (entry.key.trim() === '') return // skip if the field name is empty
    addingEntryId.value = null
    emit('add:field', entry.key as FieldName, entry.value as string)
  } else {
    // rename field
    emit('rename:field', fieldNameBeforeChange, entry.key as FieldName)
  }
  fieldNameBeforeChange = entry.key as FieldName
}

function handleOutputsValueChange(e: InputEvent, entry: Entry) {
  // skip if the field hasn't been created
  if (entry.id === addingEntryId.value) return
  const value = (e.target as HTMLInputElement).value.trim()
  emit('change:value', entry.key as FieldName, value)
}

function validateFieldName(entry: Entry) {
  errorMap.value.delete(entry.id)
  const err = props.fieldNameValidator(
    'output',
    fieldNameBeforeChange,
    entry.key as FieldName,
  )
  if (err) {
    errorMap.value.set(entry.id, err)
    return err
  }
}

function handleOutputsNameBlur(entry: Entry) {
  validateFieldName(entry)
}

</script>

<style lang="scss" scoped>
.dk-output-value-field {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;

  &-entry {
    position: relative;
    width: 100%;

    :deep(.card-header) {
      position: absolute;
      right: 8px;
      top: 8px;
      z-index: 10;
    }

    :deep(.card-content) {
      display: flex;
      flex-direction: column;
      gap: $kui-space-40;
      z-index: 1;
    }
  }
}
</style>
