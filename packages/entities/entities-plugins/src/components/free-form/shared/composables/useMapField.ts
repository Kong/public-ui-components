import { computed, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useFormShared } from './form-context'
import { useField } from './field'
import type { KeyId } from './key-id-map'
import { isKid } from './key-id-map'
import { resolve, getName } from '../utils'
import { replaceByDictionaryInFieldName } from '.'
import type { MapFieldSchema } from '../../../../types/plugins/form-schema'
import { isEqual } from 'lodash-es'

export function useMapField<T = unknown, K extends string = string>(
  name: MaybeRefOrGetter<string>,
  /**
   * @deprecated Forward compatibility, only triggered when the type of value is string
   */
  onLegacyValueChange?: (newValue: Record<K, T> | null) => void,
) {
  const { value: fieldValue, ...field } = useField<Record<KeyId, T>>(name)
  const { getEmptyOrDefault, keyIdMap } = useFormShared()
  const valueSchema = computed(() => {
    if (!field.path) return
    return (field.schema.value as MapFieldSchema).values
  })

  const keys = computed(() => {
    if (!fieldValue) return []

    const ret = Object.keys(fieldValue.value || {}).map((key) => {
      const keyId = key as KeyId
      const name = (keyIdMap.getKey(keyId) ?? '') as K
      return [keyId, name] as const
    })

    return ret
  })

  function updateKey(keyId: KeyId, newKey: K) {
    if (!fieldValue) return

    keyIdMap.updateKey(keyId, newKey)
    // Trigger reactive update
    fieldValue.value = { ...fieldValue.value }
  }

  function addKey() {
    if (!fieldValue) return

    const newKeyId = keyIdMap.createKey()
    const defaultValue = getEmptyOrDefault(resolve(field.path!.value, newKeyId))
    fieldValue.value = {
      ...fieldValue.value,
      [newKeyId]: defaultValue,
    }
    return newKeyId
  }

  function removeKey(keyId: KeyId) {
    keyIdMap.deleteKey(keyId)
    if (!fieldValue) return

    const { [keyId]: _, ...rest } = fieldValue.value || {}
    fieldValue.value = rest
  }

  function getKeyName(keyId: KeyId): K | undefined {
    return keyIdMap.getKey(keyId) as K | undefined
  }

  const fieldDisplayName = computed(() => {
    if (!field.path) return ''
    const name = getName(field.path.value)
    let displayName: string = name
    if (isKid(name)) {
      displayName = keyIdMap.getKey(name as KeyId) ?? ''
    }
    return replaceByDictionaryInFieldName(displayName)
  })

  // Forward compatibility for onChange callback, only triggered when the value type is string
  if (onLegacyValueChange && valueSchema.value?.type === 'string') {
    let lastEmittedValue: Record<K, T> | null = null
    watch(() => fieldValue?.value, (v) => {
      const newValue = getValue()
      if (isEqual(lastEmittedValue, newValue)) {
        return
      }
      lastEmittedValue = newValue
      onLegacyValueChange?.(newValue)
    }, { deep: true })

    function getValue(): Record<K, T> | null {
      if (!fieldValue || !fieldValue.value) return null

      const ret: Record<K, T> = {} as Record<K, T>
      for (const [keyId, value] of Object.entries(fieldValue.value)) {
        const key = keyIdMap.getKey(keyId as KeyId)
        if (key) {
          ret[key as K] = value
        }
      }
      return ret
    }
  }

  return {
    keys,
    updateKey,
    addKey,
    removeKey,
    field,
    fieldDisplayName,
    getKeyName,
  }
}
