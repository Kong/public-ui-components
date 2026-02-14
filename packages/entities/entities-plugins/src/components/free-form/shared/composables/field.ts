import { computed, onUnmounted, toRaw, toValue, useAttrs, watch } from 'vue'
import { FREE_FORM_SCHEMA_MAP_KEY } from '../../../../constants'
import { get, set, uniqueId } from 'lodash-es'
import { useFieldAncestors } from './ancestors'
import { useFieldPath, useFieldRenderer } from './field-path'
import { useFormShared } from './form-context'
import * as utils from '../utils'

import type { Ancestor } from './ancestors'
import type { FormSchema, UnionFieldSchema } from '../../../../types/plugins/form-schema'
import type { MaybeRefOrGetter } from 'vue'

export function useFormData<T>(name: MaybeRefOrGetter<string>) {
  const { formData } = useFormShared()
  const fieldPath = useFieldPath(name)
  const value = computed<T>({
    get: () => get(formData, utils.toArray(fieldPath.value)),
    set: (v) => set(formData, utils.toArray(fieldPath.value), v),
  })

  return {
    value,
  }
}

export function useField<TData = unknown, TSchema extends UnionFieldSchema = UnionFieldSchema>(name: MaybeRefOrGetter<string>) {
  const { getSchema, isFieldHidden, getEmptyOrDefault } = useFormShared()
  const fieldPath = useFieldPath(name)
  const renderer = useFieldRenderer(fieldPath)
  const { value } = useFormData<TData>(name)

  const schema = computed(() => getSchema<TSchema>(fieldPath.value))
  const hide = computed(() => isFieldHidden(fieldPath.value))
  const emptyOrDefaultValue = computed(() => getEmptyOrDefault(fieldPath.value))

  if (!schema.value) {
    return {
      error: new Error(`path '${fieldPath.value}' is not found in schema.`),
    }
  }

  return {
    schema,
    path: fieldPath,
    renderer,
    value,
    ancestors: useFieldAncestors(fieldPath),
    /**
     * Hide the field but keep its state.
     */
    hide,
    emptyOrDefaultValue,
    error: null,
  }
}


export function useIsAutoFocus(fieldAncestors?: MaybeRefOrGetter<Ancestor>) {
  const { getSchema } = useFormShared()
  const attrs = useAttrs()

  return computed(() => {
    if (attrs['data-autofocus'] !== undefined) {
      return true
    }

    if (!fieldAncestors) {
      return false
    }

    // If is child of array then return true
    const parent = toValue(fieldAncestors).parent
    if (parent?.path) {
      const parentType = getSchema(parent.path)?.type
      return parentType === 'array'
    }

    return false
  })
}

/**
 * To generate uniq key of each item of a list.
 * The key should be stabled when give the same reference.
 */
export function useItemKeys<T>(ns: string, items: MaybeRefOrGetter<T[]>) {
  const instanceKeyMap = new WeakMap<object, string>()
  const indexKeyMap = new Map<number, string>()

  function generateId(): string {
    return uniqueId(`${ns}-`)
  }

  function getKey(item: T, index: number): string {
    if (item == null || typeof item !== 'object') {
      return `${ns}-${index}`
    }

    if (instanceKeyMap.has(item as object)) {
      return instanceKeyMap.get(item as object)!
    }

    const newKey = indexKeyMap.has(index)
      ? indexKeyMap.get(index)!
      : generateId()

    indexKeyMap.set(index, newKey)
    instanceKeyMap.set(item as object, newKey)

    return newKey
  }

  watch(items, (newItems) => {
    const itemVal = toValue(newItems)
    const currentIndices = new Set<number>()

    itemVal.forEach((_, index) => {
      currentIndices.add(index)
    })

    Array.from(indexKeyMap.keys()).forEach((index) => {
      if (!currentIndices.has(index)) {
        indexKeyMap.delete(index)
      }
    })
  }, { immediate: true, deep: true })

  return { getKey }
}

/**
 * Exposes the given schema on the global window object for use by an auto-filler script.
 */
export function useSchemaExposer(
  schema: MaybeRefOrGetter<FormSchema>,
  instanceId: string,
) {
  watch(schema, (newSchema) => {
    if (!(window as any)[FREE_FORM_SCHEMA_MAP_KEY]) {
      (window as any)[FREE_FORM_SCHEMA_MAP_KEY] = {}
    }
    ;(window as any)[FREE_FORM_SCHEMA_MAP_KEY][instanceId] = toRaw(newSchema)
  }, { immediate: true, deep: true })

  // Clean up the schema on unmount
  onUnmounted(() => {
    if ((window as any)[FREE_FORM_SCHEMA_MAP_KEY]) {
      delete (window as any)[FREE_FORM_SCHEMA_MAP_KEY][instanceId]
    }
  })
}
