import { uniqueId, isEqual } from 'lodash-es'
import { toRef, ref, watch, useAttrs, toValue } from 'vue'
import { useField, useFieldAttrs } from '../composables'

import type { LabelAttributes } from '@kong/kongponents'
import type { EmitFn, Ref } from 'vue'

export interface KeyValueFieldProps<TKey extends string = string, TValue extends string = string> {
  name: string
  initialValue?: Record<TKey, TValue> | null
  label?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  defaultKey?: TKey
  defaultValue?: TValue
  labelAttributes?: LabelAttributes
  showVaultSecretPicker?: boolean
  // Specify the order of keys in the field.
  // If not provided, the order will be based on the order of object keys (which is not guaranteed when having numeric keys).
  keyOrder?: TKey[]
}

export interface KeyValueFieldEmits<TKey extends string = string, TValue extends string = string> {
  change: [Record<TKey, TValue> | null]
}

export interface KVEntry<TKey extends string = string, TValue extends string = string> {
  id: string
  key: TKey
  value: TValue
}

/**
 * Headless composable for implementing a key-value field.
 */
export function useKeyValueField<
  TKey extends string = string,
  TValue extends string = string,
>(
  props: KeyValueFieldProps<TKey, TValue>,
  emit: EmitFn<KeyValueFieldEmits>,
  syncToFieldValue = true,
) {
  type KVEntries = Array<KVEntry<TKey, TValue>>

  const { value: fieldValue, ...field } = useField<Record<TKey, TValue> | null>(toRef(props, 'name'))
  const isInheritedDisabled = field.isInheritedDisabled
  const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...useAttrs() }))

  const entries = ref(getEntries(
    props.initialValue ?? toValue(fieldValue) ?? ({} as Record<TKey, TValue>),
    props.keyOrder,
  )) as Ref<KVEntries>
  // the return type of ref(..) is not expected, it includes `UnwrapRef<TKey>` and `UnwrapRef<TValue>`
  // fix it by using `as`

  function generateId() {
    return uniqueId('ff-kv-field-')
  }

  /**
   * Compare function for sorting items based on a keyOrder array
   */
  function compareByKeyOrder<T extends string>(a: T, b: T, keyOrder: T[]): number {
    const indexA = keyOrder.indexOf(a)
    const indexB = keyOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return 0 // both keys not in order
    if (indexA === -1) return 1 // a comes after b
    if (indexB === -1) return -1 // b comes after a
    return indexA - indexB // sort by order in keyOrder
  }

  function getEntries(value: Record<TKey, TValue>, keyOrder?: TKey[]): KVEntries {
    const entries = Object.entries(value).map(([key, value]) => ({
      id: generateId(),
      key: key as TKey,
      value: value as TValue,
    }))
    if (keyOrder) {
      // If keyOrder is specified, sort the entries based on it
      entries.sort((a, b) => compareByKeyOrder(a.key, b.key, keyOrder))
    }
    return entries
  }

  function addEntry(): KVEntry<TKey, TValue> {
    const entry = {
      id: generateId(),
      key: props.defaultKey || ('' as TKey),
      value: props.defaultValue || ('' as TValue),
    }
    entries.value.push(entry)
    return entry
  }

  function removeEntry(id: string) {
    const index = entries.value.findIndex((entry) => entry.id === id)
    if (index !== -1) {
      entries.value.splice(index, 1)
    }
  }

  function reset() {
    entries.value = getEntries(props.initialValue || {} as Record<TKey, TValue>, props.keyOrder)
  }

  function setValue(value: Record<TKey, TValue>) {
    entries.value = getEntries(value, props.keyOrder)
  }

  let lastUpdatedValue: Record<TKey, TValue> | null = null

  // Sync entries to fieldValue
  watch([entries, isInheritedDisabled!], ([newEntries, isDisabled]) => {
    if (!syncToFieldValue || isDisabled) return
    const newValue: Record<TKey, TValue> | null = newEntries.length
      ? Object.fromEntries(newEntries.map(({ key, value }) => [key, value]).filter(([key]) => key))
      : null
    fieldValue!.value = newValue
    lastUpdatedValue = newValue
    emit('change', newValue)
  }, { deep: true, immediate: true })

  // Sync fieldValue to entries
  watch(() => fieldValue?.value, newValue => {
    // avoid infinite sync loop
    if (isEqual(newValue, lastUpdatedValue)) return
    applyChangeToEntries(newValue)
  }, { deep: true })

  /**
   * Apply changes to entries when the underlying data model changes.
   * This function intelligently updates the entries array while:
   * - Preserving existing entry IDs for stable component state/rendering
   * - Applying the specified key ordering if provided
   * - Adding new entries for keys that didn't exist before
   * - Updating values for existing keys
   * - Removing entries that no longer exist in the new value
   */
  function applyChangeToEntries(newValue?: Record<TKey, TValue> | null) {
    if (!newValue) {
      entries.value = []
      return
    }

    // Create a map of existing entries by their keys for quick lookup
    const currentEntriesMap = new Map<TKey, KVEntry<TKey, TValue>>()
    entries.value.forEach(entry => {
      if (entry.key) {
        currentEntriesMap.set(entry.key, entry)
      }
    })

    // Prepare array for the updated entries
    const newEntries: KVEntries = []
    const newKeys = Object.keys(newValue) as TKey[]

    // Apply key ordering if specified, otherwise use the original key order
    const orderedKeys = props.keyOrder
      ? [...newKeys].sort((a, b) => compareByKeyOrder(a, b, props.keyOrder!))
      : newKeys

    // Process each key in order
    orderedKeys.forEach(key => {
      const value = newValue[key]
      if (currentEntriesMap.has(key)) {
        // For existing keys: preserve the entry object (including its ID) and just update its value
        // This helps maintain component state and prevents unnecessary re-renders
        const existingEntry = currentEntriesMap.get(key)!
        existingEntry.value = value
        newEntries.push(existingEntry)
      } else {
        // For new keys: create a new entry with a fresh ID
        newEntries.push({
          id: generateId(),
          key,
          value,
        })
      }
    })

    entries.value = newEntries
  }

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
