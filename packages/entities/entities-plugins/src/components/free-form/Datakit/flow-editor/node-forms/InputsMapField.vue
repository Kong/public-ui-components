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
        {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input_name.label') }}
      </KLabel>
      <div class="dk-inputs-map-field-entry-body">
        <div class="dk-inputs-map-field-entry-content">
          <KInput
            :id="`ff-kv-entry-key-${field.path.value}.${index}`"
            v-model.trim.lazy="entry.key"
            class="ff-kv-field-entry-key"
            :data-key-input="index"
            :data-testid="`ff-key-${field.path.value}.${index}`"
            :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input_name.placeholder')"
            @change="handleInputsNameChange(entry)"
            @focus="handleBeforeInputsNameChange(entry)"
          />
          <KSelect
            v-model="entry.value"
            class="ff-kv-field-entry-value"
            clearable
            :data-testid="`ff-value-${field.path.value}.${index}`"
            :items="items"
            :placeholder="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.placeholder')"
            @change="selectItem => handleInputsValueChange(entry, selectItem?.value ?? null)"
          />
        </div>
        <KButton
          appearance="none"
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
        {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.input.add_button') }}
      </KButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, nextTick, ref } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import useI18n from '../../../../../composables/useI18n'
import { useKeyValueField } from '../../../shared/headless/useKeyValueField'
import type {
  KeyValueFieldProps,
  KeyValueFieldEmits,
  KVEntry,
} from '../../../shared/headless/useKeyValueField'
import type { FieldName, IdConnection } from '../../types'
import type { InputOption } from './composables'

interface Props extends KeyValueFieldProps<FieldName, IdConnection> {
  items: InputOption[]
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

const { i18n } = useI18n()
const root = useTemplateRef('root')
const addingEntryId = ref<string | null>(null)
const fieldNameBeforeChange = ref<FieldName | undefined>()

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
  emit('remove:field', entry.key)
}

function handleBeforeInputsNameChange(entry: KVEntry<FieldName, IdConnection>) {
  fieldNameBeforeChange.value = entry.key
}

function handleInputsNameChange(entry: KVEntry<FieldName, IdConnection>) {
  if (entry.id === addingEntryId.value) {
    // add field
    emit('add:field', entry.key, entry.value)
    addingEntryId.value = null
  } else {
    // rename field
    emit('rename:field', fieldNameBeforeChange.value!, entry.key)
  }
}

function handleInputsValueChange(entry: KVEntry<FieldName, IdConnection>, value: IdConnection | null) {
  // skip if the field hasn't been created
  if (entry.id === addingEntryId.value) return
  emit('change:inputs', entry.key, value)
}
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
    @include mixins.tree-indent;
  }
}
</style>
