import { computed } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useField, useFormShared } from '.'
import type { KeyId } from './key-id-map'
import { resolve, getName } from '../utils'
import { replaceByDictionaryInFieldName } from '.'

export function useMapField<T = unknown, K extends string = string>(
  name: MaybeRefOrGetter<string>,
) {
  const { value: fieldValue, ...field } = useField<Record<KeyId, T>>(name)
  const { getEmptyOrDefault, keyIdMap } = useFormShared()

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
    return replaceByDictionaryInFieldName(name)
  })

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
