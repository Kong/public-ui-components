import { cloneDeep, isEqual, isFunction, omit } from 'lodash-es'
import { createInjectionState } from '@vueuse/core'
import { createRenderRuleRegistry } from './render-rules'
import { FIELD_RENDERER_SLOTS, FIELD_RENDERERS } from './constants'
import { provide, reactive, ref, toRef, toValue, useSlots, watch } from 'vue'
import { useSchemaHelpers } from './schema'
import { findExpressionSourceRecord, toSourcePath } from './expression-paths'
import * as utils from '../utils'
import { useKeyIdMap } from './key-id-map'

import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { ChangeSource, EmptyValue, FormConfig, MatchMap, RenderRules } from '../types'
import type { FormSchema, UnionFieldSchema } from '../form-schema'

export const [provideFormShared, useOptionalFormShared] = createInjectionState(
  function createFormShared<T extends Record<string, any> = Record<string, any>>(options: {
    schema: FormSchema | UnionFieldSchema
    propsData?: ComputedRef<T>
    propsConfig?: MaybeRefOrGetter<FormConfig<T> | undefined>
    propsRenderRules?: MaybeRefOrGetter<RenderRules | undefined>
    onChange?: (newData: T, source: ChangeSource) => void
  }) {
    const {
      schema,
      propsData,
      onChange,
      propsRenderRules,
      propsConfig,
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

    // The source of the next `innerData` mutation the deep watcher below will
    // observe. Starts as `'init'` since the form's first flush always
    // follows initial hydration; the watcher resets it to `'user'` after
    // each run, since every leaf field writes straight into `innerData` on
    // its own — `setValue`/`markNonUserChange` are the only ones that tag
    // their own mutation as `'init'` beforehand.
    let nextChangeSource: ChangeSource = 'init'

    function setValue(newData: T) {
      nextChangeSource = 'init'
      Object.keys(innerData).forEach((key) => {
        delete (innerData as any)[key]
      })
      keyIdMap.clear()
      Object.assign(innerData, keyIdMap.serialize(newData))
    }

    /**
     * Runs `fn`, tagging whatever mutation it makes to `innerData` as
     * `'init'` rather than `'user'` — for a write that isn't a genuine user
     * edit even though it goes through the same per-field setter a user
     * edit would (e.g. an async lookup resetting a stale reference after it
     * fails to resolve). See `useField().setSilently`.
     */
    function markNonUserChange<R>(fn: () => R): R {
      nextChangeSource = 'init'
      return fn()
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

    // Emit changes when the inner data changes. `nextChangeSource` is
    // consumed (and reset to the `'user'` default) here rather than where
    // it's set, since this watcher — not the mutation itself — is what
    // fires `onChange`; Vue batches all synchronous mutations from one
    // `setValue()`/`markNonUserChange()` call into a single run of this
    // callback, so the flag is read exactly once per logical change.
    watch(innerData, () => {
      const source = nextChangeSource
      nextChangeSource = 'user'
      onChange?.(getValue(), source)
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
      markNonUserChange,
      useCurrentRenderRules,
      rootRenderRules,
      createComputedRenderRules,
      ...schemaHelpers,
      getValue,
      isFieldHidden,
      keyIdMap,
      getDefault,
      getEmptyOrDefault,
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
