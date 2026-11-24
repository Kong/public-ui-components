import { cloneDeep, isEqual, isFunction, omit } from 'lodash-es'
import { createInjectionState } from '@vueuse/core'
import { createRenderRuleRegistry } from './render-rules'
import { FIELD_RENDERER_SLOTS, FIELD_RENDERERS } from './constants'
import { computed, provide, reactive, ref, toRef, toValue, useSlots, watch } from 'vue'
import { useSchemaHelpers } from './schema'
import { findExpressionSourceRecord, toSourcePath } from './expression-paths'
import * as utils from '../utils'
import { useKeyIdMap } from './key-id-map'
import { createFieldReveal } from './reveal'
import { createFieldErrors } from './errors'
import { coversFieldPath, flattenRevealTree, matchesContainer, scanRevealTree } from './reveal-tree'

import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { EmptyValue, FieldError, FormConfig, MatchMap, RenderRules } from '../types'
import type { FormSchema, UnionFieldSchema } from '../form-schema'
import type { RevealContainerQuery, RevealNode } from './reveal-tree'

export const [provideFormShared, useOptionalFormShared] = createInjectionState(
  function createFormShared<T extends Record<string, any> = Record<string, any>>(options: {
    schema: FormSchema | UnionFieldSchema
    propsData?: ComputedRef<T>
    propsConfig?: MaybeRefOrGetter<FormConfig<T> | undefined>
    propsRenderRules?: MaybeRefOrGetter<RenderRules | undefined>
    propsErrors?: MaybeRefOrGetter<FieldError[] | undefined>
    onChange?: (newData: T) => void
    onErrorsChange?: (errors: FieldError[]) => void
  }) {
    const {
      schema,
      propsData,
      onChange,
      propsRenderRules,
      propsConfig,
      propsErrors,
      onErrorsChange,
    } = options
    const {
      getDefault: getDefaultFromSchema,
      getEmptyOrDefault: getEmptyOrDefaultFromSchema,
      ...schemaHelpers
    } = useSchemaHelpers(schema, () => toValue(propsConfig))
    const keyIdMap = useKeyIdMap(schemaHelpers.getSchema)
    const fieldRendererRegistry: MatchMap = new Map()

    const innerData = reactive<T>({} as T)
    const config = toRef(() => toValue(propsConfig) ?? {})

    // Init form level field renderer slots
    const slots = useSlots()
    provide(FIELD_RENDERER_SLOTS, omit(slots, 'default', FIELD_RENDERERS))

    const {
      useCurrentRules: useCurrentRenderRules,
      createComputedRules: createComputedRenderRules,
      hasDependencies,
      isFieldHidden,
    } = createRenderRuleRegistry(schemaHelpers.getSchemaMap, () => innerData)

    const rootRenderRules = useCurrentRenderRules({
      fieldPath: utils.rootSymbol,
      rules: propsRenderRules,
    })

    function setValue(newData: T) {
      Object.keys(innerData).forEach((key) => {
        delete (innerData as any)[key]
      })
      keyIdMap.clear()
      Object.assign(innerData, keyIdMap.serialize(newData))
    }

    // True whenever the current formData came from schema defaults rather than real given data
    // (fresh create with no data at all) — false for edit-loads and clone-with-prefilled-data
    // creates alike, since both hand in actual data. Lets a field-level consumer tell "nobody
    // gave this a value" apart from "the host/backend gave it this exact value".
    const isSchemaDefaulted = ref(false)

    /**
     * Initialize the inner data based on the provided props data or schema defaults
     */
    function initInnerData(propsData: T | undefined) {
      let dataValue: T

      if (!propsData || !hasValue(toValue(propsData))) {
        isSchemaDefaulted.value = true
        dataValue = getDefaultFromSchema()
      } else {
        isSchemaDefaulted.value = false
        dataValue = cloneDeep(toValue(propsData))
      }

      if (isFunction(config.value.prepareFormData)) {
        setValue(config.value.prepareFormData(dataValue))
      } else {
        setValue(dataValue)
      }
    }

    /**
     * The record `expressions` mirrors, resolved once from the schema. Only
     * present for a schema that declares expressible fields.
     */
    const expressionSourceRecord = findExpressionSourceRecord(schema)

    /**
     * Render rules are declared against the source fields, so a twin under
     * `expressions` matches no rule and `isFieldHidden` answers `false` for it.
     * Left at that, hiding a field would reset its plain value but submit its
     * expression, and the Gateway would still apply it. Follow the source.
     */
    function isPrunedAsHidden(path: string): boolean {
      if (isFieldHidden(path)) return true

      const sourcePath = expressionSourceRecord && toSourcePath(path, expressionSourceRecord)
      return !!sourcePath && isFieldHidden(sourcePath)
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
      const nextValue = cloneDeep(toValue(innerData))

      // Reset hidden fields to their empty-or-default value by walking the tree
      // top-down, so a hidden subtree is dropped wholesale and no missing parent
      // is ever auto-created (replaces the KM-2182 `parentExists` workaround).
      //
      // NOTE: pruning MUST run here, on the still-serialized (kid-keyed) tree,
      // before `deserialize` renames map keys. `isFieldHidden` reads each
      // dependency's actual value from `innerData` (kid-keyed) with a concrete
      // path; pruning a name-keyed tree would feed it name-keyed paths that miss
      // inside maps, silently mis-evaluating visibility for map-nested fields.
      if (hasDependencies.value) {
        utils.pruneHiddenPaths(
          nextValue,
          isPrunedAsHidden,
          getEmptyOrDefaultFromSchema,
        )
      }

      return keyIdMap.deserialize(nextValue)
    }

    // Emit changes when the inner data changes
    watch(innerData, () => {
      onChange?.(getValue())
    }, { deep: true })

    let hasInitialized = false
    // Sync the inner data when the props data changes
    watch(() => propsData?.value, newData => {
      // Avoid unnecessary data serialization
      if (hasInitialized && isEqual(getValue(), toValue(newData))) {
        return
      }

      initInnerData(newData)
      hasInitialized = true
    }, { deep: true, immediate: true })

    function serializeIfNeeded(data: any) {
      if (data != null && typeof data === 'object' && !Array.isArray(data)) {
        return keyIdMap.serialize(data)
      }
      return data
    }

    function getDefault(path?: string) {
      return serializeIfNeeded(getDefaultFromSchema(path))
    }

    function getEmptyOrDefault<T = unknown>(path?: string): T | EmptyValue {
      return serializeIfNeeded(getEmptyOrDefaultFromSchema<T>(path))
    }

    // Set while the form's content is rendered to scan it, so what the content
    // reads from the scan (e.g. a tab's error count) doesn't make it scan again
    let scanning = false

    /**
     * The fields the form's content renders and the containers they sit in,
     * mounted or not, see `scanRevealTree`. Empty when the form renders the
     * fields of its schema itself.
     */
    const revealTree = computed<RevealNode[]>(() => {
      if (!slots.default) {
        return []
      }
      scanning = true
      try {
        return scanRevealTree(slots.default({}))
      } finally {
        scanning = false
      }
    })
    const treeFields = computed(() => flattenRevealTree(revealTree.value))

    const {
      revealTarget, registerFieldElement, rememberField, findAnchor, getAnchoredMemories,
      isFieldRendered, findCoveringElement, reveal,
    } = createFieldReveal({
      formData: innerData,
      getSchema: (path) => schemaHelpers.getSchema(path),
      getKey: keyIdMap.getKey,
      getTreeFields: () => treeFields.value,
      isFieldHidden: isPrunedAsHidden,
    })

    const { getFieldErrors, getErrorsWhere, unmatchedErrors, onArrayItemRemoved, onMapKeyRenamed, onMapKeyRemoved } = createFieldErrors({
      errors: propsErrors,
      onChange: onErrorsChange,
      formData: innerData,
      getData: () => keyIdMap.deserialize(innerData),
      getSchema: (path) => schemaHelpers.getSchema(path),
      getKey: keyIdMap.getKey,
      isFieldHidden,
      isFieldRendered,
    })

    /**
     * The errors of the fields in the containers `query` picks, e.g. to show how
     * many errors an inactive tab holds
     */
    function getContainerErrors(query: RevealContainerQuery): FieldError[] {
      if (scanning) {
        return []
      }
      const treeCovers = treeFields.value.filter(field => field.containers.some(node => matchesContainer(node, query)))
      // A remembered field sits in the containers of its anchor
      const remembered = getAnchoredMemories().filter(memory => treeCovers.some(cover => coversFieldPath(cover, memory.anchor)))
      const covers = [...treeCovers, ...remembered]
      return covers.length ? getErrorsWhere(path => covers.some(cover => coversFieldPath(cover, path))) : []
    }

    return {
      /**
       * The reactive form data object
       */
      formData: innerData,
      isSchemaDefaulted,
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
      keyIdMap,
      getDefault,
      getEmptyOrDefault,
      revealTarget,
      registerFieldElement,
      rememberField,
      findAnchor,
      findCoveringElement,
      revealTree,
      getContainerErrors,
      /**
       * Reveals the field at a data path, see `createFieldReveal`
       */
      reveal,
      getFieldErrors,
      unmatchedErrors,
      onArrayItemRemoved,
      onMapKeyRenamed,
      onMapKeyRemoved,
    }
  },
)

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
    getValue: () => T
  }
}
