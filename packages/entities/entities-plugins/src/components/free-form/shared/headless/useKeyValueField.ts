import { uniqueId } from 'lodash-es'
import { toRef, ref, watch, useAttrs } from 'vue'
import { useField, useFieldAttrs } from '../composables'

import type { LabelAttributes } from '@kong/kongponents'
import type { EmitFn } from 'vue'

export interface KeyValueFieldProps {
  name: string
  initialValue?: Record<string, string> | null
  label?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  defaultKey?: string
  defaultValue?: string
  labelAttributes?: LabelAttributes
  showVaultSecretPicker?: boolean
}

export interface KeyValueFieldEmits {
  change: [Record<string, string>]
}

export interface KVEntry {
  id: string
  key: string
  value: string
}

/**
 * Headless composable for implementing a key-value field.
 */
export function useKeyValueField(
  props: KeyValueFieldProps,
  emit: EmitFn<KeyValueFieldEmits>,
) {
  const { value: fieldValue, ...field } = useField<Record<string, string>>(toRef(props, 'name'))
  const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...useAttrs() }))

  const entries = ref<KVEntry[]>(
    getEntries(
      props.initialValue ?? fieldValue?.value ?? {},
    ),
  )

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

  function addEntry() {
    entries.value.push({ id: generateId(), key: props.defaultKey || '', value: props.defaultValue || '' })
  }

  function removeEntry(id: string) {
    const index = entries.value.findIndex((entry) => entry.id === id)
    if (index !== -1) {
      entries.value.splice(index, 1)
    }
  }

  function updateValue() {
    const map = Object.fromEntries(entries.value.map(({ key, value }) => [key, value]).filter(([key]) => key))
    fieldValue!.value = map
    emit('change', map)
  }

  function reset() {
    entries.value = getEntries(props.initialValue || {})
  }

  function setValue(value: Record<string, string>) {
    entries.value = getEntries(value)
  }

  watch(entries, updateValue, { deep: true })

  return {
    /**
     * The list of key-value entries.
     * Use `v-for` to iterate over this in the template.
     */
    entries,
    /**
     * Add a empty key-value entry.
     */
    addEntry,
    /**
     * Remove a key-value entry by its ID.
     */
    removeEntry,
    /**
     * Reset the entries to the initial value.
     */
    reset,
    /**
     * Set the entries to a specific key-value object.
     */
    setValue,
    /**
     * The props for KLabel.
     */
    labelAttrs: fieldAttrs,
    /**
     * The field object.
     */
    field,
  }
}
