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
        :error="!!errorMap[entry.id]"
        :error-message="errorMap[entry.id]"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value_name')"
        required
        @blur="handleOutputsNameBlur(entry)"
        @change="handleOutputsNameChange(entry)"
        @focus="handleBeforeOutputsNameChange(entry)"
        @update:model-value="validateFieldName(entry)"
      />
      <KInput
        v-model.trim="entry.value"
        class="ff-kv-field-entry-value"
        :data-testid="`ff-value-${field.path.value}.${index}`"
        :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.value')"
        @change="handleOutputsValueChange($event, entry)"
      />
    </KCard>

    <KButton
      appearance="tertiary"
      :data-testid="`ff-kv-add-btn-${field.path.value}`"
      :disabled="!!addingEntry"
      @click="handleAddEntry"
    >
      <AddIcon />
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.output_value.add_button') }}
    </KButton>
  </div>
</template>

<script setup lang="ts">
import { useTemplateRef, nextTick, ref, watch } from 'vue'
import { AddIcon, CloseIcon } from '@kong/icons'
import { isEqual, uniqueId } from 'lodash-es'
import useI18n from '../../../../../composables/useI18n'
import type { FieldName } from '../../types'
import { useField } from '../../../shared/composables'
import type { useNodeForm } from '../composables/useNodeForm'

interface Props {
  fieldNameValidator: ReturnType<typeof useNodeForm>['fieldNameValidator']
  keyOrder?: FieldName[]
}

interface Emits {
  'change:value': [name: FieldName, value: string]
  'add:field': [name: FieldName, value?: string]
  'rename:field': [name: FieldName, newName: FieldName]
  'remove:field': [name: FieldName]
}

type DraftFieldName = FieldName | ''

interface Entry {
  id: string
  key: DraftFieldName
  value: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const errorMap = ref<Record<string, string>>({})
const { value: fieldValue, ...field } = useField<Record<FieldName, string> | null>('values')

const { i18n } = useI18n()
const root = useTemplateRef('root')
const entries = ref<Entry[]>([])
const addingEntry = ref<Entry | null>(null)

let fieldNameBeforeChange = '' as DraftFieldName
let lastKnownFieldValue: Record<FieldName, string> | null | undefined = fieldValue?.value

function generateId() {
  return uniqueId('ff-kv-field-')
}

function compareByKeyOrder(a: string, b: string, keyOrder: string[]): number {
  const indexA = keyOrder.indexOf(a)
  const indexB = keyOrder.indexOf(b)
  if (indexA === -1 && indexB === -1) return 0
  if (indexA === -1) return 1
  if (indexB === -1) return -1
  return indexA - indexB
}

function buildEntries(
  value: Record<FieldName, string> | null | undefined,
  keyOrder?: FieldName[],
): Entry[] {
  if (!value) {
    return []
  }

  const nextEntries = Object.entries(value).map(([key, entryValue]) => ({
    id: generateId(),
    key: key as FieldName,
    value: entryValue,
  }))

  if (keyOrder?.length) {
    nextEntries.sort((a, b) => compareByKeyOrder(a.key, b.key, keyOrder))
  }

  return nextEntries
}

function addEntry(): Entry {
  const entry: Entry = {
    id: generateId(),
    key: '',
    value: '',
  }
  entries.value.push(entry)
  return entry
}

function removeEntry(id: string) {
  const index = entries.value.findIndex(entry => entry.id === id)
  if (index !== -1) {
    entries.value.splice(index, 1)
  }
}

entries.value = buildEntries(fieldValue?.value, props.keyOrder)

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

function handleAddEntry() {
  const newEntry = addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)

  addingEntry.value = newEntry
}


function handleRemoveEntry(entry: Entry) {
  if (entry.id === addingEntry.value?.id) {
    addingEntry.value = null
  }
  removeEntry(entry.id)
  if (entry.key.trim() !== '') { // only emit remove if the field has a name
    emit('remove:field', entry.key as FieldName)
  }
}

function handleBeforeOutputsNameChange(entry: Entry) {
  fieldNameBeforeChange = entry.key
}

function handleOutputsNameChange(entry: Entry) {
  // Reset the value if the field name is invalid
  if (validateFieldName(entry)) {
    entry.key = fieldNameBeforeChange
    delete errorMap.value[entry.id]
    return
  }

  if (entry.id === addingEntry.value?.id) {
    // add field
    if (entry.key.trim() === '') return // skip if the field name is empty
    addingEntry.value = null
    emit('add:field', entry.key as FieldName, entry.value)
  } else {
    // rename field
    emit('rename:field', fieldNameBeforeChange as FieldName, entry.key as FieldName)
  }
  fieldNameBeforeChange = entry.key as FieldName
}

function handleOutputsValueChange(e: InputEvent, entry: Entry) {
  // skip if the field hasn't been created
  if (entry.id === addingEntry.value?.id) return
  const value = (e.target as HTMLInputElement).value.trim()
  emit('change:value', entry.key as FieldName, value)
}

function validateFieldName(entry: Entry) {
  delete errorMap.value[entry.id]
  const err = props.fieldNameValidator(
    'output',
    fieldNameBeforeChange as FieldName,
    entry.key as FieldName,
  )
  if (err) {
    errorMap.value[entry.id] = err
    return err
  }
}

function handleOutputsNameBlur(entry: Entry) {
  validateFieldName(entry)
}

watch(() => fieldValue?.value, (newValue) => {
  if (isEqual(newValue, lastKnownFieldValue)) {
    return
  }

  lastKnownFieldValue = newValue

  const draft = addingEntry.value
  const currentEntriesByKey = new Map<FieldName, Entry>(entries.value
    .filter(entry => entry.key)
    .map(entry => [entry.key as FieldName, entry]))
  const nextEntries: Entry[] = []
  const nextValue = newValue ?? {}
  const orderedKeys = props.keyOrder?.length
    ? (Object.keys(nextValue) as FieldName[]).sort((a, b) => compareByKeyOrder(a, b, props.keyOrder!))
    : Object.keys(nextValue) as FieldName[]

  orderedKeys.forEach(key => {
    const existingEntry = currentEntriesByKey.get(key)
    if (existingEntry) {
      existingEntry.value = nextValue[key]
      nextEntries.push(existingEntry)
      return
    }

    nextEntries.push({
      id: generateId(),
      key,
      value: nextValue[key],
    })
  })

  if (draft && !nextEntries.some(entry => entry.id === draft.id)) {
    nextEntries.push(draft)
  }

  entries.value = nextEntries
}, { deep: true })

</script>

<style lang="scss" scoped>
.dk-output-value-field {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-60, $kui-space-60);

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
      gap: var(--kui-space-40, $kui-space-40);
      z-index: 1;
    }
  }
}
</style>
