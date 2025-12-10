import { computed, inject, onBeforeUnmount, provide, reactive, readonly, ref, toRef, toValue, useAttrs, useSlots, watch } from 'vue'
import type { ComputedRef, InjectionKey, MaybeRefOrGetter, Slot } from 'vue'
import { marked } from 'marked'
import * as utils from './utils'
import type { LabelAttributes, SelectItem } from '@kong/kongponents'
import type { ArrayFieldSchema, ArrayLikeFieldSchema, FormSchema, RecordFieldSchema, UnionFieldSchema } from '../../../types/plugins/form-schema'
import { cloneDeep, get, isEqual, isFunction, omit, set, uniqueId } from 'lodash-es'
import type { MatchMap } from './FieldRenderer.vue'
import type { FormConfig, RenderRules, ResetLabelPathRule } from './types'
import { upperFirst } from 'lodash-es'
import { createInjectionState } from '@vueuse/core'

export const [provideFormShared, useOptionalFormShared] = createInjectionState(
  function createFormShared<T extends Record<string, any> = Record<string, any>>(options: {
    schema: FormSchema | UnionFieldSchema
    propsData?: ComputedRef<T>
    propsConfig?: FormConfig<T>
    propsRenderRules?: MaybeRefOrGetter<RenderRules | undefined>
    onChange?: (newData: T) => void
  }) {
    const {
      schema,
      propsData,
      onChange,
      propsRenderRules,
      propsConfig,
    } = options
    const schemaHelpers = useSchemaHelpers(schema)
    const fieldRendererRegistry: MatchMap = new Map()

    const innerData = reactive<T>({} as T)
    const config = toRef(() => propsConfig ?? {})

    // Init form level field renderer slots
    const slots = useSlots()
    provide(FIELD_RENDERER_SLOTS, omit(slots, 'default', FIELD_RENDERERS))

    const {
      useCurrentRules: useCurrentRenderRules,
      createComputedRules: createComputedRenderRules,
      hiddenPaths,
      isFieldHidden,
    } = createRenderRuleRegistry(handleChange)

    const {
      disabledFields,
      initDisabledFields,
      disableField,
      enableField,
      createIsAncestorDisabledComputed,
      createIsDisabledComputed,
    } = useDisabledFieldsManager(handleChange)

    const rootRenderRules = useCurrentRenderRules({
      fieldPath: utils.rootSymbol,
      rules: propsRenderRules,
      parentValue: innerData,
    })

    function setValue(newData: T) {
      Object.keys(innerData).forEach((key) => {
        delete (innerData as any)[key]
      })
      Object.assign(innerData, newData)
      disabledFields.value.clear()
      initDisabledFields(schemaHelpers.getSchemaMap(), innerData)
    }

    /**
     * Initialize the inner data based on the provided props data or schema defaults
     */
    function initInnerData(propsData: T | undefined) {
      let dataValue: T

      if (!propsData || !hasValue(toValue(propsData))) {
        dataValue = schemaHelpers.getDefault()
      } else {
        dataValue = cloneDeep(toValue(propsData))
      }

      if (isFunction(config.value.prepareFormData)) {
        setValue(config.value.prepareFormData(dataValue))
      } else {
        setValue(dataValue)
      }

      // Initialize disabled fields based on schema and data
      initDisabledFields(schemaHelpers.getSchemaMap(), innerData)
    }

    function hasValue(data: T | undefined): boolean {
      if (isFunction(config.value.hasValue)) {
        return config.value.hasValue(data)
      }
      return !!data
    }

    /**
     * Get transformed form data
     */
    function getValue(): T {
      const value = toValue(innerData)
      const nextValue = cloneDeep(value)

      // Set hidden paths to default or null
      if (hiddenPaths.value.size > 0) {
        for (const path of hiddenPaths.value) {
          set(nextValue, utils.toArray(path), schemaHelpers.getEmptyOrDefault(path))
        }
      }

      // Set disabled fields to null
      if (disabledFields.value.size > 0) {
        for (const path of disabledFields.value) {
          set(nextValue, utils.toArray(path), null)
        }
      }

      return nextValue
    }

    function handleChange() {
      onChange?.(getValue())
    }

    // Emit changes when the inner data changes
    watch(innerData, () => {
      handleChange()
    }, { deep: true })

    // Sync the inner data when the props data changes
    watch(() => propsData?.value, newData => {
      initInnerData(newData)
    }, { deep: true, immediate: true })

    return {
      /**
       * The reactive form data object
       */
      formData: innerData,
      schema,
      config,
      fieldRendererRegistry,
      setValue,
      useCurrentRenderRules,
      rootRenderRules,
      createComputedRenderRules,
      ...schemaHelpers,
      getValue,
      isFieldHidden,

      // disabled fields management
      disableField,
      enableField,
      createIsAncestorDisabledComputed,
      createIsDisabledComputed,
    }
  },
)

export const FIELD_PATH_KEY = Symbol('free-form-field-path') as InjectionKey<ComputedRef<string>>
export const FIELD_RENDERER_SLOTS = Symbol('free-form-field-renderer-slots') as InjectionKey<MaybeRefOrGetter<Record<string, Slot | undefined>>>
export const FIELD_RESET_LABEL_PATH_SETTING = Symbol('free-form-field-reset-label-path-setting') as InjectionKey<MaybeRefOrGetter<{
  parentPath: string | null
  isolate: boolean
}>>

export const FIELD_RENDERERS = 'free-form-field-renderers-slot' as const

const SHARED_LABEL_ATTRIBUTES = {
  tooltipAttributes: {
    maxWidth: '300px',
    placement: 'top',
  },
} as const

// Construct a map of all fields in a schema, with their full paths as keys
export function buildSchemaMap(schema: UnionFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
  const schemaMap: Record<string, UnionFieldSchema> = {}
  const recordSchema = (schema as RecordFieldSchema)
  if (Array.isArray(recordSchema.fields)) {
    Object.assign(schemaMap, buildRecordSchemaMap(recordSchema, pathPrefix))
  } else if (schema.type === 'array' && schema.elements) {
    Object.assign(schemaMap, buildArraySchemaMap(schema, pathPrefix))
  }

  return schemaMap
}

function buildRecordSchemaMap(recordSchema: RecordFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
  const schemaMap: Record<string, UnionFieldSchema> = {}
  if (Array.isArray(recordSchema.fields)) {
    for (const fieldDef of recordSchema.fields) {
      const fieldName = Object.keys(fieldDef)[0]
      const fieldProps = fieldDef[fieldName]
      const fieldPath = pathPrefix ? utils.resolve(pathPrefix, fieldName) : fieldName

      schemaMap[fieldPath] = fieldProps

      if (fieldProps.type === 'record' && Array.isArray(fieldProps.fields)) {
        const subMap = buildRecordSchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      } else if (fieldProps.type === 'array' && fieldProps.elements) {
        const subMap = buildArraySchemaMap(fieldProps, fieldPath)
        Object.assign(schemaMap, subMap)
      }
    }
  }
  return schemaMap
}

function buildArraySchemaMap(arraySchema: ArrayFieldSchema, pathPrefix: string = ''): Record<string, UnionFieldSchema> {
  const schemaMap: Record<string, UnionFieldSchema> = {}
  if (arraySchema.elements) {
    const elementProps = arraySchema.elements
    const elementPath = utils.resolve(pathPrefix, utils.arraySymbol)
    schemaMap[elementPath] = elementProps

    if (elementProps.type === 'record' && Array.isArray(elementProps.fields)) {
      const subMap = buildRecordSchemaMap(elementProps, elementPath)
      Object.assign(schemaMap, subMap)
    } else if (elementProps.type === 'array' && elementProps.elements) {
      const subMap = buildArraySchemaMap(elementProps, elementPath)
      Object.assign(schemaMap, subMap)
    }
  }
  return schemaMap
}

/**
 * 'a.0.b.1.c' => 'a.\*.b.\*.c'
 */
export function generalizePath(p: string) {
  const parts = utils
    .toArray(p)
    .map(node => /^\d+$/.test(node) ? utils.arraySymbol : node)
  return utils.resolve(...parts)
}

export function useSchemaHelpers(schema: MaybeRefOrGetter<FormSchema | UnionFieldSchema>) {
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
  function getSchema<T extends UnionFieldSchema = UnionFieldSchema>(path: string): T | undefined
  function getSchema<T extends UnionFieldSchema = UnionFieldSchema>(path?: string): T | UnionFieldSchema | undefined {
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
      } else if (schema.type === 'map') {
        return {}
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
      'data-testid': `ff-label-${fieldPath}`,
      info,
    }
  }

  function getSelectItems(fieldPath: string): SelectItem[] {
    const schema = getSchema(fieldPath)
    return utils.toSelectItems((schema?.one_of || (schema as ArrayLikeFieldSchema).elements?.one_of || []))
  }

  function getPlaceholder(fieldPath: string): string | null {
    const schema = getSchema(fieldPath)
    const defaultValue = schema?.default

    let stringified = null

    if (schema?.type === 'foreign' && !!defaultValue?.id) {
      stringified = defaultValue.id
    } else if (defaultValue == null || typeof defaultValue === 'object' || defaultValue === '') {
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

  function getSchemaMap() {
    return schemaMap.value
  }

  /**
   * Get empty value or default based on whether the field is required
   */
  function getEmptyOrDefault(path?: string): unknown {
    const schema = (getSchema as any)(path)
    const isRequired = schema?.required
    return isRequired ? getDefault(path) : null
  }

  return {
    getSchemaMap,
    getSchema,
    getDefault,
    getSelectItems,
    getLabelAttributes,
    getPlaceholder,
    getEmptyOrDefault,
  }
}

export function useFormShared<T extends Record<string, any> = Record<string, any>>() {
  const store = useOptionalFormShared()
  if (!store) {
    throw new Error('useFormShared() called without provider.')
  }
  // `createInjectionState` does not support generics, so we need to cast here
  return store as ReturnType<typeof useOptionalFormShared> & {
    formData: T
    config: ComputedRef<FormConfig<T>>
    onChange?: (newData: T) => void
  }
}

export const useFieldPath = (name: MaybeRefOrGetter<string>) => {
  const inheritedPath = inject(FIELD_PATH_KEY, computed(() => ''))

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
  const { getSchema, fieldRendererRegistry } = useFormShared()
  const { default: defaultSlot, ...slots } = useSlots()
  const inheritSlots = inject(FIELD_RENDERER_SLOTS)

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
    for (const [matcher, slot] of fieldRendererRegistry) {
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
  api: 'API',
  uri: 'URI',
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

export function defaultLabelFormatter(fieldPath: string): string {
  const parts = utils.toArray(fieldPath)
  return parts
    .map(fieldName => fieldName
      .split('_')
      .map(replaceByDictionary)
      .join(' '))
    .map(upperFirst)
    .join(' › ')
}

export function useFieldLabel(
  fieldPath: MaybeRefOrGetter<string>,
  resetLabelPathRule: MaybeRefOrGetter<ResetLabelPathRule | undefined>,
) {
  const pathValue = toValue(fieldPath)
  const fieldName = utils.getName(pathValue)
  const { config, getSchema } = useFormShared()
  const parentLabelPath = useLabelPath(fieldName, resetLabelPathRule)
  const ancestors = useFieldAncestors(fieldPath)

  return computed(() => {
    const realPath = parentLabelPath.value ?? fieldName

    const parentSchema = ancestors.value.parent?.path
      ? getSchema(ancestors.value.parent.path)
      : null

    const parentIsArray = parentSchema?.type === 'array'

    const res = parentIsArray
      ? '' // hide the label when it is a child of Array
      : defaultLabelFormatter(realPath)

    return config.value.transformLabel ? config.value.transformLabel(res, pathValue) : res
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

export function buildAncestor(path: string): Ancestor {
  const parts = utils.toArray(path) // [a, b, c]
  let parent: Ancestor = { parent: null }

  parts.pop()

  while (parts.length) {
    const n = parts.shift()!
    parent.path = parent.parent?.path ? utils.resolve(parent.parent.path, n) : n
    parent = { parent }
  }

  return parent
}

/**
 * a.b.c => { parent: { parent: { path: 'a.b', parent: { path: 'a', parent: null } } } }
 */
export function useFieldAncestors(fieldPath: MaybeRefOrGetter<string>) {
  return computed<Ancestor>(() => {
    return buildAncestor(toValue(fieldPath))
  })
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

export function useField<TData = unknown, TSchema extends UnionFieldSchema = UnionFieldSchema>(name: MaybeRefOrGetter<string>) {
  const {
    getSchema,
    isFieldHidden,
    getEmptyOrDefault,
    createIsAncestorDisabledComputed,
    disableField,
    enableField,
    createIsDisabledComputed,
  } = useFormShared()
  const fieldPath = useFieldPath(name)
  const renderer = useFieldRenderer(fieldPath)
  const { value } = useFormData<TData>(name)

  const schema = computed(() => getSchema<TSchema>(fieldPath.value))
  const hide = computed(() => isFieldHidden(fieldPath.value))
  const emptyOrDefaultValue = computed(() => getEmptyOrDefault(fieldPath.value))
  const isInheritedDisabled = createIsAncestorDisabledComputed(fieldPath)

  function disable(trigger = true) {
    disableField(fieldPath.value, trigger)
  }

  function enable(trigger = true) {
    enableField(fieldPath.value, trigger)
  }

  const isDisabled = createIsDisabledComputed(fieldPath)

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
    isInheritedDisabled,
    isDisabled,
    disable,
    enable,
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

function createRenderRuleRegistry(onChange: () => void) {
  type RenderRulesMap = Record<string, RenderRules>
  const registry = ref<RenderRulesMap>({})
  const hiddenPaths = ref<Set<string>>(new Set())

  /**
   * Validates that all fields in a bundle/dependency are at the same level
   */
  function validateSameLevel(fields: string[], context: string): void {
    const levels = fields.map(f => utils.toArray(f).length)
    const firstLevel = levels[0]

    if (!levels.every(level => level === firstLevel)) {
      const fieldInfo = fields.map((f, i) => `  - '${f}' is at level ${levels[i]}`).join('\n')
      throw new Error(
        `${context}: Fields must be at the same level. Found mixed levels:\n${fieldInfo}`,
      )
    }
  }

  /**
   * Validates that there are no circular references in the bundles
   *
   * @example
   * Invalid (cycle detected):
   * bundles: [
   *   ['field1', 'field2'],
   *   ['field2', 'field3'],
   *   ['field3', 'field1'], // ❌ cycle here
   *   ['field4', 'field5', 'field4'] // ❌ self-dependency
   * ]
   */
  function validateNoCycleInBundles(rules: RenderRulesMap): void {
    for (const [path, rule] of Object.entries(rules)) {
      if (!rule.bundles) continue

      // Check for self-cycles within a single bundle
      for (const bundle of rule.bundles) {
        const uniqueFields = new Set(bundle)
        if (uniqueFields.size !== bundle.length) {
          const duplicates = bundle.filter((field, index) => bundle.indexOf(field) !== index)
          throw new Error(
            `Self-cycle detected in bundle: field '${duplicates[0]}' appears multiple times in [${bundle.join(', ')}]`,
          )
        }
      }

      // Check for cycles between bundles
      // Build a dependency graph: for bundle [a, b, c], create edges b->a, c->b
      // This represents that b depends on a, c depends on b
      const bundleGraph = new Map<string, Set<string>>()
      for (const bundle of rule.bundles) {
        for (let i = 1; i < bundle.length; i++) {
          const dependent = bundle[i]
          const dependency = bundle[i - 1]

          if (!bundleGraph.has(dependent)) {
            bundleGraph.set(dependent, new Set())
          }
          bundleGraph.get(dependent)!.add(dependency)
        }
      }

      // Use DFS to detect cycles
      for (const field of bundleGraph.keys()) {
        const visited = new Set<string>()
        const stack: string[] = []

        function dfs(currentField: string): void {
          if (stack.includes(currentField)) {
            const cycle = [...stack, currentField].join(' -> ')
            throw new Error(
              `Circular bundle detected in path '${path}':\n${cycle}`,
            )
          }

          if (visited.has(currentField)) return

          visited.add(currentField)
          stack.push(currentField)

          const dependencies = bundleGraph.get(currentField)
          if (dependencies) {
            for (const dependency of dependencies) {
              dfs(dependency)
            }
          }

          stack.pop()
        }

        dfs(field)
      }
    }
  }

  /**
   * Validates that there are no circular dependencies in the rules
   * @example
   * dependencies: {
   *   'field1': ['field2', 'typeA'],
   *   'field2': ['field3', 'typeB'],
   *   'field3': ['field1', 'typeC'], // ❌ cycle here
   *   'field4': ['field4', 'typeD']  // ❌ self-dependency
   * }
   */
  function validateNoCycleInDeps(rules: RenderRulesMap): void {
    for (const [path, rule] of Object.entries(rules)) {
      if (!rule.dependencies) continue

      // Check each field for circular dependencies
      for (const field of Object.keys(rule.dependencies)) {
        const visited = new Set<string>()
        const stack: string[] = []

        function dfs(currentField: string): void {
          if (stack.includes(currentField)) {
            const cycle = [...stack, currentField].join(' -> ')
            throw new Error(
              `Circular dependency detected in path '${path}':\n${cycle}`,
            )
          }

          if (visited.has(currentField)) return

          visited.add(currentField)
          stack.push(currentField)

          const dep = rule.dependencies![currentField]
          if (dep) {
            const [depField] = dep
            if (rule.dependencies![depField]) {
              dfs(depField)
            }
          }

          stack.pop()
        }

        dfs(field)
      }
    }
  }

  /**
   * Finds the common parent path for a group of fields
   * @example
   * Input: ['a.b.c', 'a.b.d', 'a.b.e'], basePath: 'config'
   * Output: 'config.a.b'
   */
  function findCommonParentPath(fields: string[], basePath: string): string {
    const fullPaths = fields.map(f => basePath ? utils.resolve(basePath, f) : f)

    // Get the parent path of the first field
    const firstFieldParts = utils.toArray(fullPaths[0])
    firstFieldParts.pop() // Remove the field name

    return utils.resolve(...firstFieldParts)
  }

  /**
   * Removes the parent path prefix from a field path
   * @example
   * Input: fieldPath: 'config.a.b.c', parentPath: 'config.a.b'
   * Output: 'c'
   */
  function removePrefix(fieldPath: string, parentPath: string): string {
    if (!parentPath) return fieldPath

    const prefix = `${parentPath}${utils.separator}`
    if (fieldPath.startsWith(prefix)) {
      return fieldPath.slice(prefix.length)
    }

    return fieldPath
  }

  /**
   * Gets the parent path of a field path
   */
  function getParentPath(fieldPath: string): string {
    const parts = utils.toArray(fieldPath)
    parts.pop()
    return utils.resolve(...parts)
  }

  /**
   * Flattens the render rules from the registry into a path-specific structure.
   *
   * This computed property transforms the registered rules by:
   * 1. Extracting the parent path from each bundle/dependency field
   * 2. Grouping fields by their common parent path
   * 3. Removing the parent path prefix from field names
   * 4. Validating rules (same level, minimum fields, no cycles)
   *
   * @example
   * Input (registry):
   * {
   *   '$': {
   *     bundles: [['config.username', 'config.password']],
   *     dependencies: { 'config.redis': ['config.strategy', 'redis'] }
   *   }
   * }
   *
   * Output (flattenedRules):
   * {
   *   'config': {
   *     bundles: [['username', 'password']],
   *     dependencies: { 'redis': ['strategy', 'redis'] }
   *   }
   * }
   *
   * @throws {Error} If bundle contains less than 2 fields
   * @throws {Error} If bundles have cycles
   * @throws {Error} If fields in bundle/dependency are at different levels
   * @throws {Error} If dependencies have cycles
   */
  const flattenedRules = computed<RenderRulesMap>(() => {
    const result: RenderRulesMap = {}

    // Iterate through each rule in the registry
    for (const [registryPath, rules] of Object.entries(registry.value)) {
      const basePath = registryPath === utils.rootSymbol ? '' : registryPath

      // Process bundles
      if (rules.bundles) {
        for (const bundle of rules.bundles) {
          // Validate: bundle must contain at least 2 fields
          if (bundle.length < 2) {
            throw new Error(
              `Bundle must contain at least 2 fields. Found ${bundle.length} field(s) in bundle: [${bundle.join(', ')}]`,
            )
          }

          // Build full paths for validation
          const fullPaths = bundle.map(f => basePath ? utils.resolve(basePath, f) : f)

          // Validate: all fields in bundle must be at the same level
          validateSameLevel(fullPaths, `Bundle [${bundle.join(', ')}]`)

          // Find the common parent path for this bundle
          const parentPath = findCommonParentPath(bundle, basePath) || utils.rootSymbol

          if (!result[parentPath]) {
            result[parentPath] = {}
          }
          if (!result[parentPath].bundles) {
            result[parentPath].bundles = []
          }

          // Remove parent path prefix from each field
          const relativeBundle = fullPaths.map(field => removePrefix(field, parentPath))
          result[parentPath].bundles!.push(relativeBundle)
        }
      }

      // Process dependencies
      if (rules.dependencies) {
        for (const [fieldPath, [depPath, depValue]] of Object.entries(rules.dependencies)) {
          // Build full paths
          const fullFieldPath = basePath ? utils.resolve(basePath, fieldPath) : fieldPath
          const fullDepPath = basePath ? utils.resolve(basePath, depPath) : depPath

          // Validate: field and its dependency must be at the same level
          validateSameLevel(
            [fullFieldPath, fullDepPath],
            `Dependency '${fieldPath}' -> '${depPath}'`,
          )

          const parentPath = getParentPath(fullFieldPath) || utils.rootSymbol

          if (!result[parentPath]) {
            result[parentPath] = {}
          }
          if (!result[parentPath].dependencies) {
            result[parentPath].dependencies = {}
          }

          // Remove parent path prefix from both field and dependency
          const relativeFieldPath = removePrefix(fullFieldPath, parentPath)
          const relativeDepPath = removePrefix(fullDepPath, parentPath)
          result[parentPath].dependencies![relativeFieldPath] = [relativeDepPath, depValue]
        }
      }
    }

    // Validate: no circular bundles
    validateNoCycleInBundles(result)

    // Validate: no circular dependencies
    validateNoCycleInDeps(result)

    return result
  })

  function getRules(fieldPath?: string): RenderRules | undefined {
    if (!fieldPath) {
      return flattenedRules.value
    }

    // Use flattenedRules to get path-specific rules
    const generalizedPath = generalizePath(fieldPath)
    return flattenedRules.value[generalizedPath]
  }

  function createComputedRules(fieldPath: MaybeRefOrGetter<string | undefined>) {
    let hasError = false
    return computed(() => {
      if (hasError) return undefined
      const pathValue = toValue(fieldPath)
      try {
        return getRules(pathValue)
      } catch (error) {
        hasError = true
        // If an error occurs (e.g., invalid path), return undefined
        console.error(`Failed to get render rules for path: \`${pathValue}\`,`, error instanceof Error ? error.message : '')
        return undefined
      }
    })
  }

  function useCurrentRules(options: {
    fieldPath: MaybeRefOrGetter<string>
    rules?: MaybeRefOrGetter<RenderRules | undefined>
    parentValue?: MaybeRefOrGetter<unknown>
    omittedFields?: MaybeRefOrGetter<string[] | undefined>
  }) {
    const {
      fieldPath,
      rules,
      parentValue,
      omittedFields,
    } = options
    // Watch for changes in rules or fieldPath
    watch([
      () => toValue(rules),
      () => toValue(fieldPath),
    ], ([newRules, path], [, oldPath]) => {
      // Set new rules
      if (newRules) {
        registry.value[path] = newRules
      } else {
        delete registry.value[path]
      }

      // Clean up old path
      if (oldPath && oldPath !== path) {
        delete registry.value[oldPath]
      }
    }, { immediate: true, deep: true })

    const computedRules = createComputedRules(fieldPath)

    watch(
      [
        () => toValue(parentValue),
        () => toValue(computedRules)?.dependencies,
        () => toValue(fieldPath),
        () => toValue(omittedFields),
      ],
      ([parent, deps, path, omitted]) => {
        if (!deps) return

        Object.entries(deps).forEach(([fieldName, [depField, expectedDepFieldValue]]) => {
          // Skip omitted fields
          if (omitted?.includes(fieldName)) return

          const actualDepFieldValue = get(parent, depField)
          const sourceFieldPath = path
            ? utils.removeRootSymbol(utils.resolve(path, fieldName))
            : fieldName

          // Skip if dependency condition is met
          if (isEqual(actualDepFieldValue, expectedDepFieldValue)) {
            hiddenPaths.value.delete(sourceFieldPath) // Unhide the field
            onChange()
            return
          }

          hiddenPaths.value.add(sourceFieldPath) // Mark field as hidden
          onChange()
        })
      },
      { deep: true, immediate: true },
    )

    // Clean up on unmount
    onBeforeUnmount(() => {
      const path = toValue(fieldPath)
      delete registry.value[path]
    })

    return computedRules
  }

  function isFieldHidden(fieldPath: string): boolean {
    return hiddenPaths.value.has(fieldPath)
  }

  return {
    useCurrentRules,
    createComputedRules,
    hiddenPaths: readonly(hiddenPaths),
    isFieldHidden,
  }
}

function useDisabledFieldsManager(onChange?: () => void) {
  const disabledFields = ref(new Set<string>())

  /**
   * Initialize disabled fields.
   * Fields that meet **all of** the following conditions will be disabled by default:
   * - Is a record type
   * - Not required
   * - No default value
   * - No existing data
   * - Not a child of an array
   */
  function initDisabledFields(
    schemaMap: Record<string, UnionFieldSchema>,
    formData: Record<string, any>,
  ) {
    for (const [path, schema] of Object.entries(schemaMap)) {
      if (
        // is a record
        schema.type === 'record'
        // not required
        && !schema.required
        // no default value
        && !schema.default
        // no existing data
        && get(formData, utils.toArray(path)) == null
        // not a child of an array
        && schemaMap[utils.toArray(path).slice(0, -1).join('.')]?.type !== 'array'
        // A special case for **ai-mcp-oauth2** plugin where config is optional
        && path !== 'config'
      ) {
        disableField(path, false)
      }
    }
  }

  function disableField(path: string, trigger = true) {
    disabledFields.value.add(generalizePath(path))
    if (trigger) onChange?.()
  }

  function enableField(path: string, trigger = true) {
    disabledFields.value.delete(generalizePath(path))
    if (trigger) onChange?.()
  }

  function isAncestorDisabled(path: string): boolean {
    const generalizedPath = generalizePath(path)
    for (const disabledPath of disabledFields.value) {
      if (generalizedPath.startsWith(disabledPath + utils.separator)) {
        return true
      }
    }
    return false
  }

  function createIsAncestorDisabledComputed(path: MaybeRefOrGetter<string>) {
    return computed(() => {
      const pathValue = toValue(path)
      return isAncestorDisabled(pathValue)
    })
  }

  function createIsDisabledComputed(path: MaybeRefOrGetter<string>) {
    return computed(() => {
      const pathValue = toValue(path)
      return disabledFields.value.has(generalizePath(pathValue))
    })
  }

  return {
    disabledFields,
    disableField,
    enableField,
    createIsAncestorDisabledComputed,
    createIsDisabledComputed,
    initDisabledFields,
  }
}
