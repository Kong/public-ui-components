import { computed } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useField, useFormShared } from '../composables'
import type { KeyId } from '../composables/key-id-map'
import { resolve, getName } from '../utils'
import { replaceByDictionaryInFieldName } from '../composables'

export function useMapField(
  name: MaybeRefOrGetter<string>,
) {
  const { value: fieldValue, ...field } = useField<Record<KeyId, unknown>>(name)
  const { getEmptyOrDefault, keyIdMap } = useFormShared()

  const keys = computed(() => {
    if (!fieldValue) return []

    const ret = Object.keys(fieldValue.value || {}).map((key) => {
      const keyId = key as KeyId
      const name = keyIdMap.getKey(keyId) ?? ''
      return [keyId, name] as const
    })

    return ret
  })

  function updateKey(keyId: KeyId, newKey: string) {
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
  }

  function removeKey(keyId: KeyId) {
    keyIdMap.deleteKey(keyId)
    if (!fieldValue) return

    const { [keyId]: _, ...rest } = fieldValue.value || {}
    fieldValue.value = rest
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
  }
}
