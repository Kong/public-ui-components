<template>
  <div
    ref="root"
    class="ff-kv-field"
  >
    <header class="ff-kv-field-header">
      <KLabel
        v-if="label"
        class="ff-kv-field-label"
        v-bind="labelAttributes"
        :required="required"
      >
        {{ label }}
        <template
          v-if="labelAttributes?.info"
          #tooltip
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="labelAttributes?.info" />
        </template>
      </KLabel>
      <KButton
        appearance="tertiary"
        icon
        @click="handleAddClick"
      >
        <AddIcon />
      </KButton>
    </header>

    <div
      v-for="(entry, index) of entries"
      :key="entry.id"
      class="ff-kv-field-entry"
    >
      <KInput
        v-model.trim="entry.key"
        class="ff-kv-field-entry-key"
        :data-key-input="index"
        :placeholder="keyPlaceholder || 'Key'"
        @keydown.enter.prevent="focus(index, 'value')"
      />

      <KInput
        v-model.trim="entry.value"
        class="ff-kv-field-entry-value"
        :data-value-input="index"
        :placeholder="valuePlaceholder || 'Value'"
        @keydown.enter.prevent="handleValueEnter(index)"
      >
        <template #after>
          <component
            :is="autofillSlot"
            v-if="autofillSlot && showVaultSecretPicker"
            :schema="schema"
            :update="value => handleAutofill(index, value)"
            :value="entry.value"
          />
        </template>
      </KInput>

      <KButton
        appearance="tertiary"
        icon
        @click="removeEntry(entry.id)"
      >
        <TrashIcon />
      </KButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, useTemplateRef, nextTick, inject, computed } from 'vue'
import { AddIcon, TrashIcon } from '@kong/icons'
import { uniqueId } from 'lodash-es'
import type { LabelAttributes } from '@kong/kongponents'
import { AUTOFILL_SLOT, type AutofillSlot } from '@kong-ui-public/forms'

interface KVEntry {
  id: string
  key: string
  value: string
}

const props = defineProps<{
  initialValue?: Record<string, string> | null
  label?: string
  required?: boolean
  keyPlaceholder?: string
  valuePlaceholder?: string
  defaultKey?: string
  defaultValue?: string
  labelAttributes?: LabelAttributes
  showVaultSecretPicker?: boolean
}>()

const emit = defineEmits<{
  change: [Record<string, string>]
}>()

const entries = ref<KVEntry[]>(getEntries(props.initialValue || {}))

function generateId() {
  return uniqueId('ff-kv-field-')
}

function getEntries(value: Record<string, string>): KVEntry[] {
  return Object.entries(value).map(([key, value]) => ({
    id: generateId(),
    key,
    value,
  }))
}

const addEntry = () => {
  entries.value.push({ id: generateId(), key: props.defaultKey || '', value: props.defaultValue || '' })
}

const removeEntry = (id: string) => {
  const index = entries.value.findIndex((entry) => entry.id === id)
  if (index !== -1) {
    entries.value.splice(index, 1)
  }
}

const updateValue = () => {
  const map = Object.fromEntries(entries.value.map(({ key, value }) => [key, value]).filter(([key]) => key))
  emit('change', map)
}

const root = useTemplateRef('root')

async function focus(index: number, type: 'key' | 'value' = 'key') {
  if (!root.value) {
    return
  }

  await nextTick()
  root.value.querySelector<HTMLInputElement>(`[data-${type}-input="${index}"]`)?.focus()
}

watch(entries, updateValue, { deep: true })

function handleAddClick() {
  addEntry()

  const index = entries.value.findIndex(({ key }) => !key)
  focus(index === -1 ? entries.value.length - 1 : index)
}

function handleValueEnter(index: number) {
  if (index === entries.value.length - 1) {
    addEntry()
  }
  focus(index + 1)
}

const autofillSlot = inject<AutofillSlot | undefined>(AUTOFILL_SLOT, undefined)
const schema = computed(() => ({ referenceable: props.showVaultSecretPicker }))

function handleAutofill(index: number, value: string) {
  entries.value[index].value = value
}

defineExpose({
  reset: () => {
    entries.value = getEntries(props.initialValue || {})
  },
  setValue: (value: Record<string, string>) => {
    entries.value = getEntries(value)
  },
})
</script>

<style lang="scss" scoped>
.ff-kv-field {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;

  // .k-label is required to override styles correctly in KM
  &-label.k-label {
    margin-bottom: 0;
    margin-top: 0;
  }

  &-header {
    align-items: center;
    display: flex;
    gap: $kui-space-40;
    height: 32px;
  }

  &-entry {
    align-items: center;
    display: flex;
    gap: $kui-space-40;

    &-key,
    &-value {
      flex: 1 1 0;
    }
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
