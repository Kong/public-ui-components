import { computed, inject, provide, toRaw, toValue, useSlots, type ComputedRef, type MaybeRefOrGetter, type Slot } from 'vue'
import { marked } from 'marked'
import { path as pathUtils, toSelectItems } from './utils'
import type { LabelAttributes, SelectItem } from '@kong/kongponents'
import type { FormSchema, UnionFieldSchema } from '../../../types/plugins/form-schema'
import { get, set } from 'lodash-es'
import type { MatchMap } from './FieldRenderer.vue'

export const DATA_INJECTION_KEY = Symbol('free-form-data')
export const SCHEMA_INJECTION_KEY = Symbol('free-form-schema')
export const FIELD_PATH_KEY = Symbol('free-form-field-path')
export const FIELD_RENDERER_SLOTS = Symbol('free-form-field-renderer-slots')
export const FIELD_RENDERER_MATCHERS_MAP = Symbol('free-form-field-renderer-matchers-map')

export const FIELD_RENDERERS = 'free-form-field-renderers-slot' as const

const SHARED_LABEL_ATTRIBUTES = {
  tooltipAttributes: {
    maxWidth: '300px',
    placement: 'top',
  },
} as const

// Construct a map of all fields in a schema, with their full paths as keys
function buildSchemaMap(schema: any, pathPrefix: string = ''): Record<string, any> {
  const schemaMap: Record<string, any> = {}

  if (schema.type === 'record' && Array.isArray(schema.fields)) {
    for (const fieldDef of schema.fields) {
      const fieldName = Object.keys(fieldDef)[0]
      const fieldProps = fieldDef[fieldName]
      const fieldPath = pathPrefix ? pathUtils.resolve(pathPrefix, fieldName) : fieldName

      schemaMap[fieldPath] = fieldProps

      if (fieldProps.type === 'record' && Array.isArray(fieldProps.fields)) {
        const subMap = buildSchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      } else if (fieldProps.type === 'array' && fieldProps.elements) {
        const elementProps = fieldProps.elements
        const elementPath = pathUtils.resolve(fieldPath, pathUtils.arraySymbol)
        schemaMap[elementPath] = elementProps
        if (elementProps.type === 'record' && Array.isArray(elementProps.fields)) {
          const subMap = buildSchemaMap(elementProps, elementPath)
          Object.assign(schemaMap, subMap)
        }
      }
    }
  }

  console.log('schemaMap', schemaMap)

  return schemaMap
}

export function useSchemaHelpers(schema: MaybeRefOrGetter<any>) {
  const schemaValue = toValue(schema)

  const configSchema = computed(() => {
    return schemaValue?.fields?.find((field: any) => 'config' in field)?.config
  })

  const schemaMap = computed(() => {
    if (!configSchema.value) {
      return {}
    }
    return buildSchemaMap(toRaw(configSchema.value))
  })

  /**
   * 'a.0.b.1.c' => 'a.*.b.*.c'
   */
  function generalizePath(p: string) {
    const parts = pathUtils
      .toArray(p)
      .map(node => /^\d+$/.test(node) ? pathUtils.arraySymbol : node)
    return pathUtils.resolve(...parts)
  }

  /**
   * Retrieves a schema object by path
   * @param path Optional dot-notation path to a specific schema field
   * @returns The schema for the specified path or the root schema if no path provided
   */
  function getSchema(): FormSchema
  function getSchema(path: string): UnionFieldSchema | undefined
  function getSchema(path?: string): FormSchema | UnionFieldSchema | undefined {
    return path == null ? configSchema.value : schemaMap.value?.[generalizePath(path)]
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
    return toSelectItems((schema?.one_of || []))
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

  if (!formData) {
    throw new Error('useFormShared() called without form data provider.')
  }

  if (!schemaHelpers) {
    throw new Error('useFormShared() called without schema provider.')
  }

  return { formData, ...schemaHelpers }
}

export const useFieldPath = (name: MaybeRefOrGetter<string>) => {
  const inheritedPath = inject<ComputedRef<string>>(FIELD_PATH_KEY, computed(() => ''))

  const fieldPath = computed(() => {
    const nameValue = toValue(name)
    let res = nameValue

    // concat relative path
    if (!pathUtils.isAbsolute(nameValue) && inheritedPath.value) {
      res = pathUtils.resolve(inheritedPath.value, nameValue)
    }

    // remove $. from name
    if (pathUtils.isAbsolute(nameValue)) {
      res = res.slice(pathUtils.resolve(pathUtils.rootSymbol, '').length)
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
      .filter(k => k !== FIELD_RENDERERS)
      .reduce((res, key) => {
        return { ...res, [pathUtils.resolve(toValue(path), key)]: slots[key] }
      }, {})
    return inheritSlotsValue ? { ...inheritSlotsValue, ...childSlots } : childSlots
  })

  provide(FIELD_RENDERER_SLOTS, mergedSlots)

  const pathValue = toValue(path)

  return computed(() => {
    if (defaultSlot) return
    const matchedByPath = mergedSlots.value[toValue(path)]
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

export function useFieldAttrs(
  fieldPath: MaybeRefOrGetter<string>,
  props: MaybeRefOrGetter<{
    label?: string
    labelAttributes?: LabelAttributes
    required?: boolean
    placeholder?: string
  }>,
) {
  const { getLabelAttributes, getPlaceholder, getSchema } = useFormShared()

  const capitalizeEachWord = (n: string): string => {
    return n
      .replaceAll('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const pathValue = toValue(fieldPath)
  const propsValue = toValue(props)

  return computed(() => ({
    ...propsValue,
    placeholder: propsValue.placeholder ?? getPlaceholder(pathValue) ?? undefined,
    labelAttributes: propsValue.labelAttributes ?? getLabelAttributes(pathValue),
    label: propsValue.label ?? capitalizeEachWord(pathUtils.getName(pathValue)),
    required: propsValue.required ?? getSchema(pathValue)?.required,
  }))
}

export function useField<T = unknown>(name: MaybeRefOrGetter<string>) {
  const { getSchema, formData } = useFormShared()
  const fieldPath = useFieldPath(name)
  const renderer = useFieldRenderer(fieldPath)
  const value = computed<T>({
    get: () => get(formData, pathUtils.toArray(fieldPath.value)),
    set: v => set(formData, pathUtils.toArray(fieldPath.value), v),
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
    error: null,
  }
}
