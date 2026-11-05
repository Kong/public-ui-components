<template>
  <div class="kong-ui-entities-plugin-form">
    <KSkeleton
      v-if="loading"
      type="form"
    />

    <div
      v-else-if="!editing || record.id"
      class="entity-form"
    >
      <!-- Konnect-managed Redis UI for free-form layouts (StandardLayout) -->
      <component
        :is="freeformComponent"
        v-if="freeformComponent"
        :developer="developer"
        :field-renderers="pluginConfig?.fieldRenderers"
        :form-model="formModel"
        :form-schema="formSchema"
        :is-editing="editing"
        :is-konnect-managed-redis-enabled="isKonnectManagedRedisEnabled"
        :model="record"
        :on-form-change="handleFreeFormUpdate"
        :on-validity-change="onValidityChange"
        :plugin-name="formModel.name"
        :render-rules="pluginConfig?.renderRules"
        :schema="freeformSchema"
        @click:create-entity="(payload: EntityCreateEvent) => $emit('click:create-entity', payload)"
        @click:learn-more="(entity: string) => $emit('click:learn-more', entity)"
        @global-action="(name: GlobalAction, payload: any) => $emit('globalAction', name, payload)"
      >
        <template
          v-if="enableVaultSecretPicker"
          #[AUTOFILL_SLOT_NAME]="slotProps: AutofillSlotProps"
        >
          <VaultSecretPickerProvider
            v-if="slotProps.schema.referenceable"
            v-bind="slotProps"
            @open="setUpVaultSecretPicker"
          />
        </template>
      </component>
    </div>
  </div>

  <VaultSecretPicker
    :config="props.config"
    :setup="vaultSecretPickerSetup"
    @cancel="() => vaultSecretPickerSetup = false"
    @proceed="handleVaultSecretPickerAutofill"
  />
</template>

<script setup lang="ts">
import {
  VaultSecretPicker,
  VaultSecretPickerProvider,
} from '@kong-ui-public/entities-vaults'
import '@kong-ui-public/entities-vaults/dist/style.css'
import { PLUGIN_FORM_LAYOUT_STATE, useAxios, useHelpers } from '@kong-ui-public/entities-shared'
import {
  AUTOFILL_SLOT_NAME,
  FORMS_API_KEY,
  FORMS_CONFIG,
  REDIS_CREATE_SLIDEOUT,
  type AutofillSlotProps,
} from '@kong-ui-public/forms'
import '@kong-ui-public/forms/dist/style.css'
import { RedisConfigurationFormSlideout } from '@kong-ui-public/entities-redis-configurations'
import '@kong-ui-public/entities-redis-configurations/dist/style.css'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { computed, inject, markRaw, onBeforeMount, onBeforeUnmount, provide, reactive, ref, shallowReactive, shallowRef, watch, type PropType } from 'vue'
import composables from '../composables'
import { useToaster } from '../composables/useToaster'
import endpoints from '../plugins-endpoints'
import type { EntityCreateEvent, KongManagerPluginFormConfig, KonnectPluginFormConfig, PluginEntityInfo, PluginValidityChangeEvent } from '../types'
import type { FreeFormPluginData } from '../types/plugins/free-form'
import type { GlobalAction, ArrayFieldSchema, FormSchema, MapFieldSchema, RecordFieldSchema, UnionFieldSchema } from '@kong-ui-public/freeform'
import { appendEntityChecksFromMetadata, distributeEntityChecks } from './free-form/schema-enhancement'
import { getFreeFormComponent, getPluginConfig, type ResolvedPluginFormConfig } from './free-form/plugin-registry'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  /** The plugin payload to submit */
  (e: 'model-updated', data: FreeFormPluginData): void
  (e: 'globalAction', name: GlobalAction, payload: any): void
  (e: 'click:learn-more', entity: string): void
  (e: 'click:create-entity', payload: EntityCreateEvent): void
  (e: 'validity-change', payload: PluginValidityChangeEvent): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>,
    required: true,
    validator: (config: KonnectPluginFormConfig | KongManagerPluginFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      return true
    },
  },
  /**
   * Entity data if plugin is scoped
   */
  entityMap: {
    type: Object as PropType<Record<string, PluginEntityInfo>>,
    default: () => ({}),
  },
  /**
   * Plugin data if being edited
   */
  record: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  /**
   * Form schema
   */
  schema: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  /**
   * Raw schema
   */
  rawSchema: {
    type: Object as PropType<Record<string, any>>,
    default: () => ({}),
  },
  /**
   * Whether or not the form is in edit mode
   */
  editing: {
    type: Boolean,
    default: false,
  },
  /**
   * Control if the vault secret picker is enabled for applicable fields. (referenceable = true)
   */
  enableVaultSecretPicker: {
    type: Boolean,
    default: false,
  },
  /** For Kong Manager portal developers */
  developer: {
    type: Boolean,
    default: false,
  },
})

const isKonnectManagedRedisEnabled = computed<boolean>(() => {
  if (props.config.app !== 'konnect') return false

  const konnect = props.config as KonnectPluginFormConfig
  return konnect.isCloudGateway === true
})

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const { parseSchema } = composables.useSchemas({
  entityId: props.entityMap.focusedEntity?.id || undefined,
})

const pluginFormLayoutState = inject(PLUGIN_FORM_LAYOUT_STATE)
const setPluginFormLayoutState = (value: boolean) => {
  if (pluginFormLayoutState) {
    pluginFormLayoutState.value = value
  }
}

const { objectsAreEqual } = useHelpers()

const mapControlPlane = (url: string) => {
  let urlString = url

  if (props.config.app === 'konnect') {
    urlString = urlString.replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
  }

  return urlString.replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
}

// define endpoints for use by KFG
const buildGetOneUrl = (entityType: string, entityId: string): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].entityGetOne}`
  url = mapControlPlane(url)

  // replace the entity type and id
  url = url.replace(/{entity}/gi, entityType)
  url = url.replace(/{id}/gi, entityId)

  return url
}
// define endpoints for use by KFG
const buildGetAllUrl = (entityType: string): string => {
  let url = `${props.config.apiBaseUrl}${endpoints.form[props.config.app].entityGetAll}`

  url = mapControlPlane(url)

  // replace the entity type
  url = url.replace(/{entity}/gi, entityType)

  return url
}

/**
 * @param {entityType} string - the entity query path WITHOUT leading/trailing slash (ex. 'routes')
 * @param {entityId} string - the id of the entity to look up
 * @returns {Promise<import('axios').AxiosResponse<T>>}
 */
const getOne = (entityType: string, entityId: string, axiosOptions?: AxiosRequestConfig): Promise<AxiosResponse> => {
  const url = buildGetOneUrl(entityType, entityId)

  return axiosInstance.get(url, axiosOptions)
}

/**
 * @param {entityType} string - the entity query path WITHOUT leading/trailing slash (ex. 'routes')
 * @returns {Promise<import('axios').AxiosResponse<T>>}
 */
const getAll = (entityType: string, params: AxiosRequestConfig['params']): Promise<AxiosResponse> => {
  const url = buildGetAllUrl(entityType)

  // Currently hardcoded to fetch 1000 records, and filter
  // client side. If more than 1000 records, this won't work
  if (props.config.app === 'konnect') {
    return axiosInstance.get(url).then(res => {
      const { data: { data } } = res

      delete params.size
      delete params.offset

      if (data.length && Object.keys(params).length === 1) {
        const queryKey = Object.keys(params)[0]
        const filteredData = data.filter((instance: Record<string, any>) => {
          if (instance[queryKey]) {
            return !!instance[queryKey].toLowerCase().includes(params[queryKey].toLowerCase())
          }

          return false
        })

        res.data.data = filteredData
      }

      return res
    })
  }

  return axiosInstance.get(url, { params })
}

const getAllV2 = (entityType: string, params: AxiosRequestConfig['params'], signal: AbortSignal): Promise<AxiosResponse> => {
  const url = buildGetAllUrl(entityType)
  // Currently hardcoded to fetch 1000 records, and filter
  // client side. If more than 1000 records, this won't work
  if (props.config.app === 'konnect') {
    const { size, offset, ...others } = params
    if (entityType === 'consumer_groups') {
      return axiosInstance.get(url, {
        params: {
          size: 1000,
        },
        signal,
      }).then(res => {
        const { data: { data: instances } } = res

        if (instances.length && Object.keys(others).length === 1) {
          const queryKey = Object.keys(others)[0]
          const filteredData = instances.filter((instance: Record<string, any>) => {
            if (instance[queryKey]) {
              return !!instance[queryKey].toLowerCase().includes(others[queryKey].toLowerCase())
            }

            return false
          })

          res.data.data = filteredData
        }

        return res
      })
    }

    const transformedParams: AxiosRequestConfig['params'] = {
      size,
      offset,
    }

    for (const key of Object.keys(others)) {
      transformedParams.filter = {
        [key]: {
          contains: others[key],
        },
      }
    }

    return axiosInstance.get(url, {
      params: transformedParams,
      signal,
    })
  }

  return axiosInstance.get(url, { params, signal })
}

const peek = (entityType: string, size: number = 50): Promise<AxiosResponse> => {
  const url = buildGetAllUrl(entityType)

  return axiosInstance.get(url, {
    params: {
      size,
    },
  })
}

// provide to KFG
provide(FORMS_API_KEY, {
  getOne,
  getAll,
  getAllV2,
  peek,
})

// shallowReactive keeps the same object identity so all descendants can
// access properties directly (no .value unwrap needed), while staying live
// when the host replaces the entire config prop reference (e.g. once an
// async field like principalsCreationGuideVisible resolves).
const liveConfig = shallowReactive({ ...(props.config as object) })
watch(() => props.config, (newConfig) => {
  Object.assign(liveConfig, newConfig)
})
provide(FORMS_CONFIG, liveConfig)

const toaster = useToaster()
provide(REDIS_CREATE_SLIDEOUT, {
  component: markRaw(RedisConfigurationFormSlideout),
  toast: (payload: { message: string, appearance: 'success' | 'danger' }) => toaster(payload),
})

const pluginConfig = ref<ResolvedPluginFormConfig | undefined>()
const freeformComponent = shallowRef<any>()
const formSchema = ref<Record<string, any>>({})
const formModel = reactive<Record<string, any>>({})
const freeformSchema = computed(() => {
  const enhanced = appendEntityChecksFromMetadata(
    formModel.name,
    props.rawSchema as FormSchema,
  )
  return distributeEntityChecks(enhanced)
})

const vaultSecretPickerSetup = ref<string | false>(false)
const vaultSecretPickerAutofillAction = ref<(secretRef: string) => void | undefined>()
const setUpVaultSecretPicker = (setupValue: string, autofillAction: (secretRef: string) => void) => {
  vaultSecretPickerSetup.value = setupValue ?? ''
  vaultSecretPickerAutofillAction.value = autofillAction
}
const handleVaultSecretPickerAutofill = (secretRef: string) => {
  vaultSecretPickerAutofillAction.value?.(secretRef)
  vaultSecretPickerSetup.value = false
}

const syncFormRenderingMode = (pluginName?: string) => {
  if (!pluginName) {
    pluginConfig.value = undefined
    freeformComponent.value = undefined

    setPluginFormLayoutState(false)

    return
  }

  // For cloned plugins, use the source plugin name for rendering decisions
  const effectivePluginName = props.schema?._sourcePlugin || pluginName
  pluginConfig.value = getPluginConfig(effectivePluginName)
  freeformComponent.value = getFreeFormComponent(effectivePluginName)

  setPluginFormLayoutState(Boolean(freeformComponent.value))
}

const onValidityChange = (event: PluginValidityChangeEvent) => {
  emit('validity-change', event)
}

// Walks a config value alongside its raw-schema subtree and drops keys that aren't in
// the schema's `fields[]`. Deprecated `shorthand_fields` live in their own array on each
// record, never in `fields[]`, so they fall out naturally — preventing the backend from
// re-filling canonical fields (e.g. `redis.password`) from stale shorthand values.
//
// Polymorphic records (e.g. datakit's `nodes[]` whose actual field set is chosen by a
// `subschema_key` + `subschema_definitions` discriminator) are deliberately NOT dispatched:
// Kong schemas treat the discriminator field and other implicit common fields (e.g. `name`)
// as runtime-required but don't always declare them inside each concrete subschema. Walking
// with the concrete subschema would over-strip those fields. Such records have no declared
// `fields[]` on the element schema itself, so they pass through the array branch unchanged.
const stripUnknownConfigFields = (value: any, subschema: UnionFieldSchema | undefined): any => {
  if (!subschema) return value

  // Array (or set — Kong `set` values are JSON arrays with the same `elements` schema shape).
  // Recurse into each element when the schema declares an `elements` subschema. Primitive
  // elements (e.g. `{ type: 'string' }`) are safe — the recursive call hits the early
  // `typeof value !== 'object'` return. Records without declared `fields[]` (polymorphic
  // `subschema_definitions`) pass through via the `!Array.isArray(fields)` guard below.
  if (Array.isArray(value)) {
    const elements = (subschema as ArrayFieldSchema).elements
    if (elements) {
      return value.map((item) => stripUnknownConfigFields(item, elements))
    }
    return value
  }

  // Primitive or null — nothing to strip.
  if (!value || typeof value !== 'object') return value

  // Map — recurse into each value with the values-subschema.
  // Map KEYS are user-defined and remain opaque; only values get walked.
  // Covers map-of-records, map-of-arrays, and nested maps uniformly.
  // Primitive-valued maps (e.g. string → string) are safe: the recursive call
  // hits the early `!value || typeof value !== 'object'` return.
  if ((subschema as MapFieldSchema).type === 'map' && (subschema as MapFieldSchema).values) {
    const valuesSchema = (subschema as MapFieldSchema).values as UnionFieldSchema
    const result: Record<string, any> = {}
    for (const key of Object.keys(value)) {
      result[key] = stripUnknownConfigFields(value[key], valuesSchema)
    }
    return result
  }

  // Record with no declared `fields[]` (e.g. primitive-valued `map`) — pass through.
  if (!Array.isArray((subschema as RecordFieldSchema).fields)) return value

  const fieldByName = new Map<string, UnionFieldSchema | undefined>()
  for (const fieldDef of (subschema as RecordFieldSchema).fields) {
    const name = fieldDef && Object.keys(fieldDef)[0]
    if (name) fieldByName.set(name, fieldDef[name])
  }

  const result: Record<string, any> = {}
  for (const key of Object.keys(value)) {
    const childSchema = fieldByName.get(key)
    if (!childSchema) continue // unknown — drop (shorthand_field or stale alias)
    result[key] = stripUnknownConfigFields(value[key], childSchema)
  }
  return result
}

const getConfigSubschema = (): UnionFieldSchema | undefined => {
  const fields = props.rawSchema?.fields
  if (!Array.isArray(fields)) return undefined
  const configField = fields.find((f: Record<string, any>) => f?.config)
  return configField?.config
}

// Plugins whose schemas use polymorphic-record patterns (e.g. datakit's `nodes[].type`
// dispatch) declare `name`/`type` as implicit common fields that the FE schema model can't
// reliably recover from `subschema_definitions` alone. Skip the strip entirely for them —
// the walker would over-strip those implicit fields and break the payload.
const STRIP_BYPASS_PLUGINS = new Set(['datakit'])

// Mirrors the cloned-plugin resolution at line 475 — `_sourcePlugin` wins for clones so a
// `datakit-clone` plugin is also recognized as datakit for strip-bypass purposes.
const effectivePluginName = computed(() => (props.schema?._sourcePlugin || formModel.name) as string | undefined)

// The free-form layout owns every field of the payload except the plugin `name`
const handleFreeFormUpdate = (value: FreeFormPluginData) => {
  const unknownFieldStripped: FreeFormPluginData = !STRIP_BYPASS_PLUGINS.has(effectivePluginName.value as string)
    ? { ...value, config: stripUnknownConfigFields(value.config, getConfigSubschema()) }
    : value

  emit('model-updated', { name: formModel.name, ...unknownFieldStripped })
}

const loading = ref(true)
const initFormModel = (): void => {
  // When the plugin is created under an entity, preselect it as the scope
  // e.g. `service-id: <entityId>`, the free-form layout reads it from the form model
  if (Object.keys(props.entityMap).length && !props.entityMap.global) {
    for (const entity in props.entityMap) {
      const id = props.entityMap[entity].id
      const idField = props.entityMap[entity].idField
      const key = idField === 'consumer_group_id' ? 'consumer_group-id' : idField?.replace('_', '-')

      if (key && Object.prototype.hasOwnProperty.call(formModel, key)) {
        formModel[key] = id
      }
    }
  }

  loading.value = false
}

watch(loading, (newLoading) => {
  emit('loading', newLoading)
})
// if the schema changed we've got to start over and completely rebuild the form model
watch(() => props.schema, (newSchema, oldSchema) => {
  if (objectsAreEqual(newSchema || {}, oldSchema || {})) {
    return
  }
  const parsedForm: Record<string, any> = parseSchema(newSchema)

  Object.assign(formModel, parsedForm.model)

  formSchema.value = {
    fields: formSchema.value?.fields?.map((r: Record<string, any>) => {
      return { ...r, disabled: r.disabled || false }
    }),
  }
  syncFormRenderingMode(parsedForm.model.name)

  initFormModel()
}, { immediate: true, deep: true })

onBeforeMount(() => {
  const form = parseSchema(props.schema)

  Object.assign(formModel, form.model)
  formSchema.value = form.schema
  syncFormRenderingMode(form.model.name)

  initFormModel()
})

onBeforeUnmount(() => {
  setPluginFormLayoutState(false)
})
</script>

<style lang="scss" scoped>
.kong-ui-entities-plugin-form {
  width: 100%;

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}
</style>
