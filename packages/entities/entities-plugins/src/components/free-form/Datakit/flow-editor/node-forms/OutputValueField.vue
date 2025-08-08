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
        v-model.trim="entry.key"
        class="ff-kv-field-entry-key"
        :data-key-input="index"
        :data-testid="`ff-key-${field.path.value}.${index}`"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value_name')"
        @change="handleInputsNameChange(entry)"
        @focus="handleBeforeInputsNameChange(entry)"
      />
      <KInput
        v-model.trim="entry.value"
        class="ff-kv-field-entry-value"
        :data-testid="`ff-value-${field.path.value}.${index}`"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value')"
        @change="handleInputsValueChange($event, entry)"
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

interface Props extends KeyValueFieldProps<FieldName, string> {
}

interface Emits extends KeyValueFieldEmits {
  'change:value': [name: FieldName, value: string]
  'add:field': [name: FieldName, value?: string]
  'rename:field': [name: FieldName, newName: FieldName]
  'remove:field': [name: FieldName]
}

type Entry = KVEntry<FieldName, string>

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  entries,
  addEntry,
  removeEntry,
  field,
} = useKeyValueField<FieldName, string>(props, emit, false)

const { i18n } = useI18n()
const root = useTemplateRef('root')
const addingEntryId = ref<string | null>(null)
// const errorIds = ref(new Set<string>())

let fieldNameBeforeChange: FieldName

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function handleAddEntry() {
  const { id } = addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)

  addingEntryId.value = id
}


function handleRemoveEntry(entry: Entry) {
  if (entry.id === addingEntryId.value) {
    addingEntryId.value = null
  }
  removeEntry(entry.id)
  emit('remove:field', entry.key as FieldName)
}

function handleBeforeInputsNameChange(entry: Entry) {
  fieldNameBeforeChange = entry.key
}

function handleInputsNameChange(entry: Entry) {
  if (entry.id === addingEntryId.value) {
    addingEntryId.value = null
    // add field
    emit('add:field', entry.key, entry.value)
  } else {
    // rename field
    emit('rename:field', fieldNameBeforeChange, entry.key)
  }
}

function handleInputsValueChange(e: InputEvent, entry: Entry) {
  // skip if the field hasn't been created
  if (entry.id === addingEntryId.value) return
  const value = (e.target as HTMLInputElement).value.trim()
  // errorIds.value.add(entry.id)
  emit('change:value', entry.key, value)
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
    }

    :deep(.card-content) {
      display: flex;
      flex-direction: column;
      gap: $kui-space-40;
    }
  }
}
</style>
