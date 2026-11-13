import { computed, getCurrentInstance, onBeforeUnmount, onUnmounted, toRaw, toValue, watch } from 'vue'
import { FREE_FORM_SCHEMA_MAP_KEY } from '../constants'
import { get, set, uniqueId } from 'lodash-es'
import { useFieldAncestors } from './ancestors'
import { useFieldPath, useFieldRenderer } from './field-path'
import { useFormShared } from './form-context'
import { getVNodeElement } from './reveal'
import * as utils from '../utils'

import type { FormSchema, UnionFieldSchema } from '../form-schema'
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
  const {
    getSchema, isFieldHidden, getEmptyOrDefault, getEmptyValue, getFieldVersionInfo,
    revealTarget: formRevealTarget, registerFieldElement, getFieldErrors,
  } = useFormShared()
  const fieldPath = useFieldPath(name)
  const renderer = useFieldRenderer(fieldPath)
  const { value } = useFormData<TData>(name)

  const schema = computed(() => getSchema<TSchema>(fieldPath.value))
  const hide = computed(() => isFieldHidden(fieldPath.value))
  /**
   * Set when this field's `min_ai_gateway_version` exceeds `FormConfig.minRuntimeVersion`
   * — `undefined` when the field has no version requirement, or the requirement is met.
   */
  const versionInfo = computed(() => getFieldVersionInfo(fieldPath.value))
  /**
   * The default for this field, forcing required-field structure/defaults
   * back in. Use only for initialization (new array item, new map entry,
   * hidden-field reset) — never for a user-initiated clear, since it would
   * make a required field with an explicit `schema.default` impossible to
   * empty.
   */
  const emptyOrDefaultValue = computed(() => getEmptyOrDefault<TData>(fieldPath.value))
  /**
   * The configured empty-field sentinel on its own (no required/default
   * awareness). Use this when the user actively clears a field's value.
   * `TData` is expected to include `EmptyValue` in its declared union.
   */
  const emptyValue = computed(() => getEmptyValue() as TData)

  if (!schema.value) {
    return {
      error: new Error(`path '${fieldPath.value}' is not found in schema.`),
    }
  }

  /**
   * The field path being revealed, when it is this field or inside it.
   * Containers open themselves while it is set.
   */
  const revealTarget = computed(() => {
    const target = formRevealTarget.value
    return target && utils.isWithinPath(target, fieldPath.value) ? target : null
  })

  /**
   * The errors of this field and of the fields below it, for a field that
   * shows its value as a whole (a set rendered as tags gets the errors of its
   * items). A field with child fields shows `ownFieldErrors` instead and
   * leaves the rest to the children.
   */
  const fieldErrors = computed(() => getFieldErrors(fieldPath.value))
  const ownFieldErrors = computed(() => getFieldErrors(fieldPath.value, false))
  /** `fieldErrors` as one line, for controls that take a single message */
  const fieldErrorMessage = computed(() => fieldErrors.value.map(error => error.message).join('; '))

  // Calling `useField` means the component renders this field, so it is
  // where a reveal of this path lands.
  const instance = getCurrentInstance()
  if (instance) {
    onBeforeUnmount(registerFieldElement({
      path: () => fieldPath.value,
      element: () => getVNodeElement(instance.subTree),
    }))
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
    versionInfo,
    revealTarget,
    fieldErrors,
    ownFieldErrors,
    fieldErrorMessage,
    emptyOrDefaultValue,
    emptyValue,
    error: null,
  }
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
