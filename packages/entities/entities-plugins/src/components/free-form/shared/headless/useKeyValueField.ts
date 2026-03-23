import { isEqual } from 'lodash-es'
import { toRef, watch, useAttrs, toValue, computed } from 'vue'
import { useField, useFieldAttrs, useFormShared } from '../composables'
import { resolve, mapSymbol } from '../utils'

import type { LabelAttributes } from '@kong/kongponents'
import type { EmitFn, Ref } from 'vue'
import type { BaseFieldProps } from '../types'
import type { KeyId } from '../composables/key-id-map'

export interface KeyValueFieldProps<T = unknown, K extends string = string> extends BaseFieldProps {
  initialValue?: Record<K, T> | null
  label?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  appearance?: {
    string?: {
      multiline?: boolean
    }
  }
  labelAttributes?: LabelAttributes
  showVaultSecretPicker?: boolean
  // Specify the order of keys in the field.
  // If not provided, the order will be based on the order of object keys (which is not guaranteed when having numeric keys).
  /**
   * @deprecated
   */
  keyOrder?: K[]
}

export interface KeyValueFieldEmits<T = unknown, K extends string = string> {
  change: [Record<K, T> | null]
}

export interface KVEntry<T = unknown, K extends string = string> {
  id: KeyId
  key: K
  value: T
}

function useKeyValueManager<T = unknown, K extends string = string>(
  name: Ref<string>,
) {
  const { value, path } = useField<Record<KeyId, T>>(name)
  const { keyIdMap: keyValueStore, getEmptyOrDefault } = useFormShared()

  const entries = computed(() => {
    const values = toValue(value)
    const result: Array<KVEntry<T, K>> = []
    if (!values) return result

    Object.getOwnPropertySymbols(values).forEach((keyId) => {
      const key = keyValueStore.getKey(keyId as KeyId) as K | undefined
      if (key === undefined) return
      result.push({
        id: keyId as KeyId,
        key,
        value: values[keyId as KeyId],
      })
    })
    return result
  })

  function addEntry(): KeyId {
    const id = keyValueStore.createKey()
    let defaultVal

    if (defaultVal === undefined) {
      const emptyOrDefault = getEmptyOrDefault<Record<K, T>>(resolve(path!.value, mapSymbol))
      if (emptyOrDefault) {
        defaultVal = keyValueStore.serialize(emptyOrDefault)[id as KeyId]
      }
    }

    value!.value = {
      ...toValue(value),
      [id]: defaultVal,
    }
    return id
  }

  function removeEntry(id: KeyId) {
    const { [id]: _, ...rest } = toValue(value) || {}
    value!.value = rest
    keyValueStore.deleteKey(id)
  }

  function updateKey(id: KeyId, newKeyName: K) {
    const currentValue = toValue(value)
    if (!currentValue || !Object.prototype.hasOwnProperty.call(currentValue, id)) return

    keyValueStore.updateKey(id, newKeyName)
    value!.value = { ...currentValue } // Force trigger reactive update
  }

  function updateValue(id: KeyId, newValue: T) {
    const currentValue = toValue(value)
    if (!currentValue || !Object.prototype.hasOwnProperty.call(currentValue, id)) return

    value!.value = {
      ...currentValue,
      [id]: newValue,
    }
  }

  function deserialize(): Record<K, T> | null {
    // null or undefined or {}
    const realValue = toValue(value)
    if (!realValue || Object.getOwnPropertySymbols(realValue).length === 0) {
      return null
    }

    return keyValueStore.deserialize(realValue)
  }

  return {
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
     * Update the key of a key-value entry by its ID.
     */
    updateKey,
    /**
     * Update the value of a key-value entry by its ID.
     */
    updateValue,
    /**
     * Deserialize the key-value entries.
     */
    deserialize,
    /**
     * Serialize the key-value entries.
     */
    serialize: keyValueStore.serialize,
  }
}

export function useKeyValueField<T = unknown, K extends string = string>(
  props: KeyValueFieldProps<T, K>,
  emit: EmitFn<KeyValueFieldEmits<T, K>>,
) {

  const {
    value: fieldValue,
    emptyOrDefaultValue,
    ...field
  } = useField<Record<K, T> | null>(toRef(props, 'name'))

  const fieldAttrs = useFieldAttrs(field.path!, toRef({ ...props, ...useAttrs() }))
  const {
    entries,
    deserialize,
    serialize,
    ...keyValueManager
  } = useKeyValueManager<T, K>(toRef(props, 'name'))

  function reset() {
    if (props.initialValue) {
      fieldValue!.value = serialize(props.initialValue)
    } else {
      fieldValue!.value = emptyOrDefaultValue?.value ?? null
    }
  }

  function setValue(data: Record<K, T>) {
    fieldValue!.value = serialize(data)
  }

  let lastUpdatedValue = fieldValue?.value

  // Trigger change event
  watch(
    () => fieldValue?.value,
    () => {
      const newValue = deserialize()
      lastUpdatedValue = fieldValue!.value
      emit('change', newValue)
    },
    { deep: true, immediate: true },
  )

  // Serialize fieldValue when it changes externally
  watch(() => fieldValue?.value, newValue => {
    // Avoid infinite sync loop
    if (isEqual(lastUpdatedValue, newValue)) return
    fieldValue!.value = fieldValue!.value ? serialize(fieldValue!.value) : fieldValue!.value
  }, { deep: true })

  return {
    /**
     * The list of key-value entries.
     * Use `v-for` to iterate over this in the template.
     */
    entries,
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

    ...keyValueManager,
  }
}
