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
    class="dk-inputs-map-field"
  >
    <div
      v-for="(entry, index) of entries"
      :key="entry.id"
      class="dk-inputs-map-field-entry"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <KLabel :for="`ff-kv-entry-key-${field.path.value}.${index}`">
        {{ t('plugins.free-form.datakit.flow_editor.node_properties.input_name.label') }}
      </KLabel>
      <div class="dk-inputs-map-field-entry-body">
        <div class="dk-inputs-map-field-entry-content">
          <KInput
            :id="`ff-kv-entry-key-${field.path.value}.${index}`"
            class="ff-kv-field-entry-key"
            :data-key-input="index"
            :data-testid="`ff-key-${field.path.value}.${index}`"
            :error="errorMap.has(entry.id)"
            :error-message="errorMap.get(entry.id)"
            :model-value="entry.key"
            :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.input_name.placeholder')"
            @blur="handleInputsNameBlur(entry)"
            @change="handleInputsNameChange(entry)"
            @focus="handleBeforeInputsNameChange(entry)"
            @update:model-value="v => handleKeyInput(entry.id, v)"
          />
          <KSelect
            class="ff-kv-field-entry-value"
            clearable
            :data-testid="`ff-value-${field.path.value}.${index}`"
            enable-filtering
            :items="items"
            :label="t('plugins.free-form.datakit.flow_editor.node_properties.input.source')"
            :model-value="(entry.value as IdConnection)"
            :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
            @change="selectItem => handleInputsValueChange(entry, selectItem?.value ?? null)"
          >
            <template
              v-if="$slots['item-label']"
              #item-template="{ item }"
            >
              <slot
                name="item-label"
                v-bind="item"
              />
            </template>
          </KSelect>
        </div>
        <KButton
          appearance="tertiary"
          class="dk-inputs-map-field-remove-btn"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          icon
          @click="handleRemoveEntry(entry)"
        >
          <CloseIcon />
        </KButton>
      </div>
    </div>

    <KButton
      appearance="tertiary"
      :data-testid="`ff-kv-add-btn-${field.path.value}`"
      :disabled="!!addingEntryId"
      @click="handleAddClick"
    >
      <AddIcon />
      {{ t('plugins.free-form.datakit.flow_editor.node_properties.input.add_button') }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, nextTick, ref, watch } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import useI18n from '../../../../../composables/useI18n'
import { useKeyValueField } from '../../../shared/headless/useKeyValueField'
import type {
  KeyValueFieldProps,
  KeyValueFieldEmits,
} from '../../../shared/headless/useKeyValueField'
import type { KeyId } from '../../../shared/composables/kv'
import type { FieldName, IdConnection } from '../../types'
import type { InputOption, useNodeForm } from '../composables/useNodeForm'

interface Props extends KeyValueFieldProps<IdConnection> {
  items: InputOption[]
  fieldNameValidator: ReturnType<typeof useNodeForm>['fieldNameValidator']
}

interface Emits extends KeyValueFieldEmits {
  'change:inputs': [name: FieldName, value: IdConnection | null]
  'add:field': [name: FieldName, value?: IdConnection | null]
  'remove:field': [name: FieldName]
  'rename:field': [oldName: FieldName, newName: FieldName]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  entries,
  addEntry,
  removeEntry,
  updateKey,
  field,
} = useKeyValueField(props, emit)

const { i18n: { t } } = useI18n()
const root = useTemplateRef('root')
const addingEntryId = ref<KeyId | null>(null)
const errorMap = ref(new Map<KeyId, string>())

let fieldNameBeforeChange: FieldName

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function handleAddClick() {
  const id = addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)

  addingEntryId.value = id
}

type Entry = { id: KeyId, key: string, value: unknown }

function handleRemoveEntry(entry: Entry) {
  removeEntry(entry.id)
  if (entry.id === addingEntryId.value) {
    addingEntryId.value = null
  }
  if (entry.key.trim() !== '') { // only emit remove if the field has a name
    emit('remove:field', entry.key as FieldName)
  }
}

function getEntry(id: KeyId): Entry | undefined {
  return entries.value.find(e => e.id === id)
}

function handleKeyInput(id: KeyId, value: string) {
  updateKey(id, value.trim())
  const entry = getEntry(id)
  if (entry) validateFieldName(entry)
}

function handleBeforeInputsNameChange(entry: Entry) {
  fieldNameBeforeChange = entry.key as FieldName
}

function handleInputsNameChange(entry: Entry) {
  // Reset the value if the field name is invalid
  if (validateFieldName(entry)) {
    updateKey(entry.id, fieldNameBeforeChange)
    errorMap.value.delete(entry.id)
    return
  }

  if (entry.id === addingEntryId.value) {
    // add field
    if (entry.key.trim() === '') return // skip if the field name is empty
    emit('add:field', entry.key as FieldName, entry.value as IdConnection)
    addingEntryId.value = null
  } else {
    // rename field
    emit('rename:field', fieldNameBeforeChange, entry.key as FieldName)
  }
  fieldNameBeforeChange = entry.key as FieldName
}

function validateFieldName(entry: Entry) {
  errorMap.value.delete(entry.id)
  const err = props.fieldNameValidator(
    'input',
    fieldNameBeforeChange,
    entry.key as FieldName,
  )
  if (err) {
    errorMap.value.set(entry.id, err)
    return err
  }
}

function handleInputsNameBlur(entry: Entry) {
  validateFieldName(entry)
}

function handleInputsValueChange(entry: Entry, value: IdConnection | null) {
  // skip if the field hasn't been created
  if (entry.id === addingEntryId.value) return
  emit('change:inputs', entry.key as FieldName, value)
}

watch(() => entries.value, (newEntries) => {
  if (addingEntryId.value) {
    if (!newEntries.find(({ id }) => id === addingEntryId.value)) {
      addingEntryId.value = null
    }
  }
})
</script>

<style lang="scss" scoped>
.dk-inputs-map-field {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: $kui-space-60;

  &-entry {
    width: 100%;

    &-body {
      align-items: flex-start;
      display: flex;
    }

    &-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: $kui-space-40;
    }
  }

  &-remove-btn {
    margin-top: 4.5px;
  }
}
</style>
