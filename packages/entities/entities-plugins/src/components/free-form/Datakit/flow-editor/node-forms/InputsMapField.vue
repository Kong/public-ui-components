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
      class="dk-inputs-map-field-entry dk-inputs-map-field-indent"
      :data-testid="`ff-kv-container-${field.path.value}.${index}`"
    >
      <KLabel :for="`ff-kv-entry-key-${field.path.value}.${index}`">
        {{ t('plugins.free-form.datakit.flow_editor.node_properties.input_name.label') }}
      </KLabel>
      <div class="dk-inputs-map-field-entry-body">
        <div class="dk-inputs-map-field-entry-content">
          <KInput
            :id="`ff-kv-entry-key-${field.path.value}.${index}`"
            v-model.trim="entry.key"
            class="ff-kv-field-entry-key"
            :data-key-input="index"
            :data-testid="`ff-key-${field.path.value}.${index}`"
            :error="!!errorMap[entry.id]"
            :error-message="errorMap[entry.id]"
            :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.input_name.placeholder')"
            @blur="handleInputsNameBlur(entry)"
            @change="handleInputsNameChange(entry)"
            @focus="handleBeforeInputsNameChange(entry)"
            @update:model-value="validateFieldName(entry)"
          />
          <KSelect
            v-model="entry.value"
            class="ff-kv-field-entry-value"
            clearable
            :data-testid="`ff-value-${field.path.value}.${index}`"
            enable-filtering
            :items="items"
            :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
            @change="selectItem => handleInputsValueChange(entry, selectItem?.value ?? null)"
          />
        </div>
        <KButton
          appearance="none"
          class="dk-inputs-map-field-remove-btn"
          :data-testid="`ff-kv-remove-btn-${field.path.value}.${index}`"
          icon
          @click="handleRemoveEntry(entry)"
        >
          <CloseIcon />
        </KButton>
      </div>
    </div>

    <div class="dk-inputs-map-field-indent">
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
  KVEntry,
} from '../../../shared/headless/useKeyValueField'
import type { FieldName, IdConnection } from '../../types'
import type { InputOption, useNodeForm } from '../composables/useNodeForm'

interface Props extends KeyValueFieldProps<FieldName, IdConnection> {
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
  field,
} = useKeyValueField<FieldName, IdConnection>(props, emit)

const { i18n: { t } } = useI18n()
const root = useTemplateRef('root')
const addingEntryId = ref<string | null>(null)
const errorMap = ref<Record<string, string>>({})

let fieldNameBeforeChange: FieldName

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function handleAddClick() {
  const { id } = addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)

  addingEntryId.value = id
}

function handleRemoveEntry(entry: KVEntry<FieldName, IdConnection>) {
  removeEntry(entry.id)
  if (entry.id === addingEntryId.value) {
    addingEntryId.value = null
  }
  if (entry.key.trim() !== '') { // only emit remove if the field has a name
    emit('remove:field', entry.key)
  }
}

function handleBeforeInputsNameChange(entry: KVEntry<FieldName, IdConnection>) {
  fieldNameBeforeChange = entry.key
}

function handleInputsNameChange(entry: KVEntry<FieldName, IdConnection>) {
  // Reset the value if the field name is invalid
  if (validateFieldName(entry)) {
    entry.key = fieldNameBeforeChange
    delete errorMap.value[entry.id]
    return
  }

  if (entry.id === addingEntryId.value) {
    // add field
    if (entry.key.trim() === '') return // skip if the field name is empty
    emit('add:field', entry.key, entry.value)
    addingEntryId.value = null
  } else {
    // rename field
    emit('rename:field', fieldNameBeforeChange, entry.key)
  }
  fieldNameBeforeChange = entry.key
}

function validateFieldName(entry: KVEntry<FieldName, IdConnection>) {
  delete errorMap.value[entry.id]
  const err = props.fieldNameValidator(
    'input',
    fieldNameBeforeChange,
    entry.key,
  )
  if (err) {
    errorMap.value[entry.id] = err
    return err
  }
}

function handleInputsNameBlur(entry: KVEntry<FieldName, IdConnection>) {
  validateFieldName(entry)
}

function handleInputsValueChange(entry: KVEntry<FieldName, IdConnection>, value: IdConnection | null) {
  // skip if the field hasn't been created
  if (entry.id === addingEntryId.value) return
  emit('change:inputs', entry.key, value)
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
@use '../styles/tree-indent' as mixins;

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

  &-indent {
    @include mixins.tree-indent(
      $last-child-height: 31.5px
    );
  }

  &-remove-btn {
    margin-top: 4.5px;
  }
}
</style>
