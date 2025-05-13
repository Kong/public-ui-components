import { computed, inject, provide, ref, toRef, toValue, useAttrs, useSlots, watch, type ComputedRef, type MaybeRefOrGetter, type Slot } from 'vue'
import { marked } from 'marked'
import * as utils from './utils'
import type { LabelAttributes, SelectItem } from '@kong/kongponents'
import type { FormSchema, RecordFieldSchema, UnionFieldSchema } from '../../../types/plugins/form-schema'
import { get, set } from 'lodash-es'
import type { MatchMap } from './FieldRenderer.vue'
import type { FormConfig, ResetLabelPathRule } from './types'
import { capitalize } from 'lodash-es'

export const DATA_INJECTION_KEY = Symbol('free-form-data')
export const SCHEMA_INJECTION_KEY = Symbol('free-form-schema')
export const FIELD_PATH_KEY = Symbol('free-form-field-path')
export const FIELD_RENDERER_SLOTS = Symbol('free-form-field-renderer-slots')
export const FIELD_RENDERER_MATCHERS_MAP = Symbol('free-form-field-renderer-matchers-map')
export const FORM_CONFIG = Symbol('free-form-config')
export const FIELD_RESET_LABEL_PATH_SETTING = Symbol('free-form-field-reset-label-path-setting')

export const FIELD_RENDERERS = 'free-form-field-renderers-slot' as const

const SHARED_LABEL_ATTRIBUTES = {
  tooltipAttributes: {
    maxWidth: '300px',
    placement: 'top',
  },
} as const

// Construct a map of all fields in a schema, with their full paths as keys
function buildSchemaMap(schema: UnionFieldSchema, pathPrefix: string = ''): Record<string, any> {
  const schemaMap: Record<string, any> = {}
  const recordSchema = (schema as RecordFieldSchema)
  if (Array.isArray(recordSchema.fields)) {
    for (const fieldDef of recordSchema.fields) {
      const fieldName = Object.keys(fieldDef)[0]
      const fieldProps = fieldDef[fieldName]
      const fieldPath = pathPrefix ? utils.resolve(pathPrefix, fieldName) : fieldName

      schemaMap[fieldPath] = fieldProps

      if (fieldProps.type === 'record' && Array.isArray(fieldProps.fields)) {
        const subMap = buildSchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      } else if (fieldProps.type === 'array' && fieldProps.elements) {
        const elementProps = fieldProps.elements
        const elementPath = utils.resolve(fieldPath, utils.arraySymbol)
        schemaMap[elementPath] = elementProps
        if (elementProps.type === 'record' && Array.isArray(elementProps.fields)) {
          const subMap = buildSchemaMap(elementProps, elementPath)
          Object.assign(schemaMap, subMap)
        }
      }
    }
  }

  return schemaMap
}

/**
 * 'a.0.b.1.c' => 'a.*.b.*.c'
 */
function generalizePath(p: string) {
  const parts = utils
    .toArray(p)
    .map(node => /^\d+$/.test(node) ? utils.arraySymbol : node)
  return utils.resolve(...parts)
}

export function useSchemaHelpers(schema: MaybeRefOrGetter<FormSchema>) {
  const schemaValue = toValue(schema)

  // const configSchema = computed(() => {
  //   return schemaValue?.fields?.find((field: any) => 'config' in field)?.config
  // })

  const schemaMap = computed(() => {
    if (!schemaValue) {
      return {}
    }
    return buildSchemaMap(schemaValue)
  })

  /**
   * Retrieves a schema object by path
   * @param path Optional dot-notation path to a specific schema field
   * @returns The schema for the specified path or the root schema if no path provided
   */
  function getSchema(): FormSchema
  function getSchema(path: string): UnionFieldSchema | undefined
  function getSchema(path?: string): FormSchema | UnionFieldSchema | undefined {
    return path == null ? schemaValue : schemaMap.value?.[generalizePath(path)]
  }

  /**
   * Creates a default value for a field, respecting its schema definition
   * @param path Path to the field in dot notation (e.g., 'foo.bar')
   * @param force When true, forces creation of structure even for optional fields
   * @returns The default value for the field based on its schema
   */
  function createFieldDefault(path: string, force: boolean = false): any {
    const schema = getSchema(path)
    if (!schema) {
      return null
    }

    // Use explicit default if provided
    if (schema.default !== undefined) {
      return schema.default
    }

    // Create structures when forced or for required fields
    if (force || schema.required) {
      if (schema.type === 'record') {
        return createRecordDefault(schema, path)
      } else if (schema.type === 'array') {
        return []
      } else {
        return null
      }
    }

    // Non-required fields default to null
    return null
  }

  /**
   * Creates a default object for a record schema
   * @param schema The record schema definition
   * @param path Current field path
   */
  function createRecordDefault(schema: any, path: string): Record<string, any> {
    const result: Record<string, any> = {}

    if (Array.isArray(schema.fields)) {
      for (const field of schema.fields) {
        const key = Object.keys(field)[0]
        const fieldPath = path ? `${path}.${key}` : key

        const value = createFieldDefault(fieldPath, false)
        if (value !== undefined) {
          result[key] = value
        }
      }
    }
    return result
  }

  /**
   * Gets the default value for a field or the entire form
   * @param path Optional path to a field
   * @returns Default value for the field or entire form
   */
  function getDefault(path?: string): any {
    if (path) {
      // For any specific path access, force creation of that field
      return createFieldDefault(path, true)
    } else {
      // For the entire form, respect required flags without forcing
      return createRecordDefault(getSchema(), '')
    }
  }

  function getLabelAttributes(fieldPath: string): LabelAttributes {
    const schema = getSchema(fieldPath)
    const info = schema?.description ? marked.parse(schema.description, { async: false }) : undefined
    return {
      ...SHARED_LABEL_ATTRIBUTES,
      info,
    }
  }

  function getSelectItems(fieldPath: string): SelectItem[] {
    const schema = getSchema(fieldPath)
    return utils.toSelectItems((schema?.one_of || []))
  }

  function getPlaceholder(fieldPath: string): string | null {
    const defaultValue = getSchema(fieldPath)?.default

    let stringified = null

    if (defaultValue == null || typeof defaultValue === 'object' || defaultValue === '') {
      return null
    } else if (Array.isArray(defaultValue)) {
      if (defaultValue.length === 0) {
        return null
      }
      stringified = defaultValue.join(', ')
    } else {
      stringified = defaultValue.toString()
    }

    return `Default: ${stringified}`
  }

  return {
    getSchema,
    getDefault,
    getSelectItems,
    getLabelAttributes,
    getPlaceholder,
  }
}

export function useFormShared<T>() {
  const formData = inject<T>(DATA_INJECTION_KEY)
  const schemaHelpers = inject<ReturnType<typeof useSchemaHelpers>>(SCHEMA_INJECTION_KEY)
  const formConfig = inject<FormConfig>(FORM_CONFIG, {})

  if (!formData) {
    throw new Error('useFormShared() called without form data provider.')
  }

  if (!schemaHelpers) {
    throw new Error('useFormShared() called without schema provider.')
  }

  return { formData, formConfig, ...schemaHelpers }
}

export const useFieldPath = (name: MaybeRefOrGetter<string>) => {
  const inheritedPath = inject<ComputedRef<string>>(FIELD_PATH_KEY, computed(() => ''))

  const fieldPath = computed(() => {
    const nameValue = toValue(name)
    let res = nameValue

    // concat relative path
    if (!utils.isAbsolute(nameValue) && inheritedPath.value) {
      res = utils.resolve(inheritedPath.value, nameValue)
    }

    // remove $. from name
    if (utils.isAbsolute(nameValue)) {
      res = res.slice(utils.resolveRoot('').length)
    }
    return res
  })

  provide(FIELD_PATH_KEY, fieldPath)

  return fieldPath
}

export const useFieldRenderer = (path: MaybeRefOrGetter<string>) => {
  const { getSchema } = useFormShared()
  const { default: defaultSlot, ...slots } = useSlots()
  const inheritSlots = inject<MaybeRefOrGetter<Record<string, Slot>>>(FIELD_RENDERER_SLOTS)

  const matchMap = inject<MatchMap>(FIELD_RENDERER_MATCHERS_MAP)!

  const mergedSlots = computed(() => {
    const inheritSlotsValue = toValue(inheritSlots)
    // Set relative path to each slot key
    const childSlots: Record<string, Slot<any> | undefined> = Object.keys(slots)
      .filter(k => k !== FIELD_RENDERERS && k !== 'item')
      .reduce((res, key) => {
        const newKey = generalizePath(utils.resolve(toValue(path), key))
        return { ...res, [newKey]: slots[key] }
      }, {})
    return inheritSlotsValue ? { ...inheritSlotsValue, ...childSlots } : childSlots
  })

  provide(FIELD_RENDERER_SLOTS, mergedSlots)

  const pathValue = toValue(path)

  return computed(() => {
    if (defaultSlot) return
    const matchedByPath = mergedSlots.value[generalizePath(toValue(path))]
    if (matchedByPath) return matchedByPath

    // todo(zehao): priority
    for (const [matcher, slot] of matchMap) {
      if (matcher({ path: pathValue, schema: getSchema(pathValue)! })) {
        return slot
      }
    }
    return undefined
  })
}

const labelDictionary: Record<string, string> = {
  ip: 'IP',
  ssl: 'SSL',
  ttl: 'TTL',
  url: 'URL',
  http: 'HTTP',
}

function replaceByDictionary(name: string) {
  return labelDictionary[name.toLocaleLowerCase()] ?? name
}

export function useLabelPath(fieldName: string, rule: MaybeRefOrGetter<ResetLabelPathRule | undefined>) {
  type Setting = {
    parentPath: string | null
    isolate: boolean
  }

  const inheritedSetting = inject<MaybeRefOrGetter<Setting>>(FIELD_RESET_LABEL_PATH_SETTING, {
    parentPath: null,
    isolate: false,
  })

  const { parentPath, isolate } = toValue(inheritedSetting)

  // default inherit from parent
  const finalPath = ref(parentPath ? utils.resolve(parentPath, fieldName) : fieldName)

  const nextSetting = ref<Setting>({
    parentPath: finalPath.value,
    isolate,
  })

  watch([toRef(rule), toRef(inheritedSetting)], ([ruleValue, settingValue]) => {
    const { parentPath, isolate } = settingValue
    const inheritedPath = parentPath ? utils.resolve(parentPath, fieldName) : fieldName

    if (ruleValue) {
      const ruleHandlers: Record<ResetLabelPathRule, () => void> = {
        'isolate': () => {
          finalPath.value = fieldName
          nextSetting.value.isolate = true
          nextSetting.value.parentPath = null
        },
        'isolate-children': () => {
          nextSetting.value.isolate = true
          nextSetting.value.parentPath = null
        },
        'reset': () => {
          finalPath.value = fieldName
          nextSetting.value.isolate = false
          nextSetting.value.parentPath = null
        },
        'reset-children': () => {
          nextSetting.value.isolate = false
          nextSetting.value.parentPath = null
        },
        'inherit': () => {
          finalPath.value = inheritedPath
          nextSetting.value.isolate = false
          nextSetting.value.parentPath = inheritedPath
        },
      }

      ruleHandlers[ruleValue]?.()
    } else if (isolate) {
      finalPath.value = fieldName
      nextSetting.value.isolate = true
      nextSetting.value.parentPath = null
    }
  }, { deep: true, immediate: true })

  provide(FIELD_RESET_LABEL_PATH_SETTING, nextSetting)

  return finalPath
}

export function useFieldLabel(
  fieldPath: MaybeRefOrGetter<string>,
  resetLabelPathRule: MaybeRefOrGetter<ResetLabelPathRule | undefined>,
) {
  const pathValue = toValue(fieldPath)
  const fieldName = utils.getName(pathValue)
  const { formConfig } = useFormShared()
  const parentLabelPath = useLabelPath(fieldName, resetLabelPathRule)
  const { getSchema } = useFormShared()
  const ancestors = useFieldAncestors(fieldPath)

  return computed(() => {
    const realPath = parentLabelPath.value ?? fieldName
    const parts = utils.toArray(realPath)

    const parentSchema = ancestors.value.parent?.path
      ? getSchema(ancestors.value.parent.path)
      : null

    const parentIsArray = parentSchema?.type === 'array'

    const res = parentIsArray
      ? '' // hide the label when it is a child of Array
      : parts
        .map(fieldName => fieldName
          .split('_')
          .map(capitalize)
          .map(replaceByDictionary)
          .join(' '))
        .join(' › ')

    return formConfig.transformLabel ? formConfig.transformLabel(res, pathValue) : res
  })
}

export function useFieldAttrs(
  fieldPath: MaybeRefOrGetter<string>,
  props: MaybeRefOrGetter<{
    label?: string
    labelAttributes?: LabelAttributes
    required?: boolean
    placeholder?: string
    resetLabelPath?: ResetLabelPathRule
  }>,
) {
  const { getLabelAttributes, getPlaceholder, getSchema } = useFormShared()

  const pathValue = toValue(fieldPath)
  const propsValue = toValue(props)

  const label = useFieldLabel(fieldPath, toRef(() => toValue(props).resetLabelPath))

  return computed(() => ({
    ...propsValue,
    placeholder: propsValue.placeholder ?? getPlaceholder(pathValue) ?? undefined,
    labelAttributes: propsValue.labelAttributes ?? getLabelAttributes(pathValue),
    label: propsValue.label ?? label.value,
    required: propsValue.required ?? getSchema(pathValue)?.required,
  }))
}

export type Ancestor = {
  path?: string
  parent: Ancestor | null
}

/**
 * a.b.c => { parent: { parent: { path: 'a.b', parent: { path: 'a', parent: null } } } }
 */
export function useFieldAncestors(fieldPath: MaybeRefOrGetter<string>) {
  return computed<Ancestor>(() => {
    const parts = utils.toArray(toValue(fieldPath)) // [a, b, c]
    let parent: Ancestor = { parent: null }

    parts.pop()

    while (parts.length) {
      const n = parts.shift()!
      parent.path = parent.parent?.path ? utils.resolve(parent.parent.path, n) : n
      parent = { parent }
    }

    return parent
  })
}

export function useField<T = unknown>(name: MaybeRefOrGetter<string>) {
  const { getSchema, formData } = useFormShared()
  const fieldPath = useFieldPath(name)
  const renderer = useFieldRenderer(fieldPath)
  const value = computed<T>({
    get: () => get(formData, utils.toArray(fieldPath.value)),
    set: v => set(formData, utils.toArray(fieldPath.value), v),
  })

  const schema = computed(() => getSchema(fieldPath.value))

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
    error: null,
  }
}

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
