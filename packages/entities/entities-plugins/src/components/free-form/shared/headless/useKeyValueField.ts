import { uniqueId } from 'lodash-es'
import { toRef, ref, watch, useAttrs, toValue } from 'vue'
import { useField, useFieldAttrs } from '../composables'
import { isEqual } from 'lodash-es'

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
}

export interface KeyValueFieldEmits<TKey extends string = string, TValue extends string = string> {
  change: [Record<TKey, TValue>]
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
) {
  const { value: fieldValue, ...field } = useField<Record<TKey, TValue>>(toRef(props, 'name'))
  const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...useAttrs() }))

  const entries = ref(getEntries(
    props.initialValue ?? toValue(fieldValue) ?? ({} as Record<TKey, TValue>)),
  ) as Ref<Array<KVEntry<TKey, TValue>>>
  // the return type of ref(..) is not expected, it includes `UnwrapRef<TKey>` and `UnwrapRef<TValue>`
  // fix it by using `as`

  function generateId() {
    return uniqueId('ff-kv-field-')
  }

  function getEntries(value: Record<TKey, TValue>): Array<KVEntry<TKey, TValue>> {
    return Object.entries(value).map(([key, value]) => ({
      id: generateId(),
      key: key as TKey,
      value: value as TValue,
    }))
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
    entries.value = getEntries(props.initialValue || {} as Record<TKey, TValue>)
  }

  function setValue(value: Record<TKey, TValue>) {
    entries.value = getEntries(value)
  }

  let lastUpdatedValue: Record<TKey, TValue> | null = null

  // Sync entries to fieldValue
  watch(entries, (newEntries) => {
    const newValue = Object.fromEntries(newEntries.map(({ key, value }) => [key, value]).filter(([key]) => key))
    fieldValue!.value = newValue
    lastUpdatedValue = newValue
    emit('change', newValue)
  }, { deep: true, immediate: true })

  // Sync fieldValue to entries
  watch(() => fieldValue?.value, newValue => {
    if (!newValue) return
    // avoid infinite sync loop
    if (isEqual(toValue(newValue), lastUpdatedValue)) return
    entries.value = getEntries(toValue(newValue))
  }, { deep: true })

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
