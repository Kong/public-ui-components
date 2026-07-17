import { cloneDeep, isEqual, isFunction, omit } from 'lodash-es'
import { createInjectionState } from '@vueuse/core'
import { createRenderRuleRegistry } from './render-rules'
import { FIELD_RENDERER_SLOTS, FIELD_RENDERERS } from './constants'
import { provide, reactive, toRef, toValue, useSlots, watch } from 'vue'
import { useSchemaHelpers } from './schema'
import * as utils from '../utils'
import { useKeyIdMap } from './key-id-map'

import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { FormConfig, MatchMap, RenderRules } from '../types'
import type { FormSchema, UnionFieldSchema } from '../../../../types/plugins/form-schema'

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
    const {
      getDefault: getDefaultFromSchema,
      getEmptyOrDefault: getEmptyOrDefaultFromSchema,
      ...schemaHelpers
    } = useSchemaHelpers(schema)
    const keyIdMap = useKeyIdMap(schemaHelpers.getSchema)
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
    } = createRenderRuleRegistry(() => onChange?.(getValue()), schemaHelpers.getSchemaMap)

    const rootRenderRules = useCurrentRenderRules({
      fieldPath: utils.rootSymbol,
      rules: propsRenderRules,
      parentValue: innerData,
    })

    function setValue(newData: T) {
      Object.keys(innerData).forEach((key) => {
        delete (innerData as any)[key]
      })
      keyIdMap.clear()
      Object.assign(innerData, keyIdMap.serialize(newData))
    }

    /**
     * Initialize the inner data based on the provided props data or schema defaults
     */
    function initInnerData(propsData: T | undefined) {
      let dataValue: T

      if (!propsData || !hasValue(toValue(propsData))) {
        dataValue = getDefaultFromSchema()
      } else {
        dataValue = cloneDeep(toValue(propsData))
      }

      if (isFunction(config.value.prepareFormData)) {
        setValue(config.value.prepareFormData(dataValue))
      } else {
        setValue(dataValue)
      }
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
      if (hiddenPaths.value.size > 0) {
        utils.pruneHiddenPaths(
          nextValue,
          isFieldHidden,
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

    function getEmptyOrDefault<T = unknown>(path?: string): T | null {
      return serializeIfNeeded(getEmptyOrDefaultFromSchema<T>(path))
    }

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
