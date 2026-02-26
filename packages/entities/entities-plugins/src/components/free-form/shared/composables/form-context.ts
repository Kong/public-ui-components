import { cloneDeep, get, isFunction, omit, set } from 'lodash-es'
import { createInjectionState } from '@vueuse/core'
import { createRenderRuleRegistry } from './render-rules'
import { FIELD_RENDERER_SLOTS, FIELD_RENDERERS } from './constants'
import { provide, reactive, toRef, toValue, useSlots, watch } from 'vue'
import { useSchemaHelpers } from './schema'
import * as utils from '../utils'

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
    } = createRenderRuleRegistry(() => onChange?.(getValue()))

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
          const pathArray = utils.toArray(path)

          // Check if the parent path exists before setting
          // This is a temporary fix to prevent lodash set() from auto-creating intermediate objects
          // todo(KM-2182): Refactor data layer to listen to data source changes and clean up hiddenPaths accordingly
          const parentPath = pathArray.slice(0, -1)
          const parentExists = parentPath.length === 0 || get(nextValue, parentPath) != null

          if (parentExists) {
            set(nextValue, pathArray, schemaHelpers.getEmptyOrDefault(path))
          }
        }
      }

      return nextValue
    }

    // Emit changes when the inner data changes
    watch(innerData, () => {
      onChange?.(getValue())
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
