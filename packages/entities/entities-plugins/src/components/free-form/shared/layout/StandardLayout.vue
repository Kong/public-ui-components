<template>
  <Form
    ref="form"
    class="ff-standard-layout"
    :config="realFormConfig"
    :data="(prunedData as T)"
    :render-rules="renderRules"
    :schema="freeFormSchema"
    tag="div"
    @change="handleDataChange"
  >
    <!-- global field templates -->
    <template #[FIELD_RENDERERS]>
      <!-- Redis partial selector -->
      <FieldRenderer
        :match="({ path }) => path === redisPartialInfo?.redisPath?.value"
      >
        <RedisSelector />
      </FieldRenderer>

      <!-- Identity Realms field (key-auth plugin only) -->
      <FieldRenderer
        v-slot="props"
        :match="({ path }) => pluginName === 'key-auth' && path === 'config.identity_realms'"
      >
        <IdentityRealmsField v-bind="props" />
      </FieldRenderer>
    </template>

    <template v-if="editorMode === 'form'">
      <EntityFormBlock
        :description="generalInfoDescription ?? t('plugins.form.sections.general_info.description')"
        :step="1"
        :title="generalInfoTitle ?? t('plugins.form.sections.general_info.title')"
      >
        <div class="enabled">
          <VFGField
            :form-options="formOptions"
            :vfg-schema="enabledSchema"
          />
        </div>
        <div class="scope">
          <KRadio
            v-model="scoped"
            card
            card-orientation="horizontal"
            v-bind="radioGroup[0]"
            :selected-value="false"
            @update:model-value="handleScopeChange"
          />
          <KRadio
            v-model="scoped"
            card
            card-orientation="horizontal"
            v-bind="radioGroup[1]"
            :selected-value="true"
            @update:model-value="handleScopeChange"
          />
        </div>
        <div
          v-if="scoped && scopeEntitiesSchema"
          class="scope-detail"
        >
          <VFGField
            :form-options="formOptions"
            :vfg-schema="scopeEntitiesSchema"
          />
        </div>
        <KCollapse
          v-model="moreCollapsed"
          trigger-label="Show more"
        >
          <VFGField
            :form-options="formOptions"
            :vfg-schema="moreFieldsSchema"
          />
        </KCollapse>

        <template
          v-if="slots['general-info-title']"
          #title
        >
          <slot name="general-info-title" />
        </template>

        <template
          v-if="slots['general-info-description']"
          #description
        >
          <slot name="general-info-description" />
        </template>

        <template
          v-if="slots['general-info-extra']"
          #extra
        >
          <slot name="general-info-extra" />
        </template>
      </EntityFormBlock>
      <EntityFormBlock
        :description="pluginConfigDescription ?? t('plugins.form.sections.plugin_config.description')"
        :step="2"
        :title="pluginConfigTitle ?? t('plugins.form.sections.plugin_config.title')"
      >
        <slot />

        <template
          v-if="slots['plugin-config-title']"
          #title
        >
          <slot name="plugin-config-title" />
        </template>

        <template
          v-if="slots['plugin-config-description']"
          #description
        >
          <slot name="plugin-config-description" />
        </template>

        <template
          v-if="slots['plugin-config-extra']"
          #extra
        >
          <slot name="plugin-config-extra" />
        </template>
      </EntityFormBlock>
    </template>
    <template v-else>
      <!-- TODO: Implement default code editor -->
      <slot name="code-editor" />
    </template>
  </Form>
</template>

<script lang="ts">
export type Props<T extends FreeFormPluginData = any> = {
  generalInfoTitle?: string
  generalInfoDescription?: string
  pluginConfigTitle?: string
  pluginConfigDescription?: string
  /** FreeForm Schema */
  schema: FormSchema
  /** VFG schema */
  formSchema: any
  /** The **initial** entire plugin model, never update */
  model: T
  /** VFG form model */
  formModel: Record<string, any>
  formOptions: any
  isEditing: boolean
  onModelUpdated: (value: any, model: string) => void
  /** Emits the final submission payload to the parent, the payload will be merged with the `formModel` but it has high override priority */
  onFormChange: (value: Partial<T>) => void
  onValidityChange?: (event: PluginValidityChangeEvent) => void
  editorMode?: 'form' | 'code'
  /** FreeForm configuration */
  formConfig?: FormConfig<T>
  renderRules?: RenderRules
  pluginName: string
}
</script>

<script setup lang="ts" generic="T extends FreeFormPluginData">
import { computed, inject, nextTick, ref, useTemplateRef } from 'vue'
import { EntityFormBlock } from '@kong-ui-public/entities-shared'
import { has, pick } from 'lodash-es'
import { KRadio } from '@kong/kongponents'
import english from '../../../../locales/en.json'
import { createI18n } from '@kong-ui-public/i18n'
import Form from '../Form.vue'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { PluginValidityChangeEvent } from '../../../../types'
import VFGField from '../VFGField.vue'
import type { FormConfig, RenderRules } from '../types'
import FieldRenderer from '../FieldRenderer.vue'
import { REDIS_PARTIAL_INFO } from '../const'
import RedisSelector from '../RedisSelector.vue'
import { FIELD_RENDERERS } from '../composables'
import IdentityRealmsField from '../../../fields/key-auth-identity-realms/FreeFormAdapter.vue'

const { t } = createI18n<typeof english>('en-us', english)

const { editorMode = 'form', ...props } = defineProps<Props<T>>()

const redisPartialInfo = inject(REDIS_PARTIAL_INFO)

const slots = defineSlots<{
  default: () => any
  'code-editor'?: () => any
  'general-info-title'?: () => any
  'general-info-description'?: () => any
  'general-info-extra'?: () => any
  'plugin-config-title'?: () => any
  'plugin-config-description'?: () => any
  'plugin-config-extra'?: () => any
}>()

const realFormConfig = computed(() => {
  return props.formConfig ?? {
    hasValue: (data?: T): boolean => !!data && Object.keys(data).length > 0,
  }
})

interface LegacyFormSchemaField {
  model: string
  type: string
  fields: LegacyFormSchemaField[]
  label?: string
  description?: string
}

interface LegacyFormSchemaGroup {
  fields: LegacyFormSchemaField[]
  collapsible?: {
    nestedCollapsible?: {
      fields?: LegacyFormSchemaField[]
    }
  }
}

const flattenFormSchemaFields = computed<LegacyFormSchemaField[]>(() => {
  if (props.formSchema?.groups) {
    return props.formSchema.groups.reduce(
      (acc: any[], group: LegacyFormSchemaGroup) => {
        const fields = group.fields

        const allFields = group.collapsible?.nestedCollapsible?.fields
          ? fields.concat(group.collapsible.nestedCollapsible.fields)
          : fields

        return acc.concat(allFields)
      },
      [] as LegacyFormSchemaField[],
    )
  }
  return props.formSchema?.fields || []
})

const enabledSchema = computed(() => {
  return {
    fields: flattenFormSchemaFields.value.filter(field => field.model === 'enabled'),
  }
})

const scopeSchema = computed(() => {
  return flattenFormSchemaFields.value.find(field => field.type === 'selectionGroup')
})

const radioGroup = computed(() => {
  return (scopeSchema.value?.fields || []).map(({ label, description }) => ({ label, description }))
})

const scopeEntitiesSchema = computed(() => {
  return scopeSchema.value?.fields?.[1]
})

const moreFieldsSchema = computed(() => {
  const fields = ['instance_name', 'protocols', 'tags']

  return {
    fields: flattenFormSchemaFields.value.filter(field => fields.includes(field.model!)),
  }
})

const FREE_FORM_SCHEMA_KEYS = ['config']
const freeFormSchema = computed(() => {
  const result: FormSchema = {
    type: 'record',
    fields: props.schema.fields.filter(item => FREE_FORM_SCHEMA_KEYS.includes(Object.keys(item)[0])),
  }

  // append VFG fields to the freeform schema
  const vfgFields = [
    // enabled field
    ...enabledSchema.value.fields,
    // scope fields
    ...(scopeEntitiesSchema.value?.fields ?? []),
    // general info fields
    ...moreFieldsSchema.value.fields,
  ]
  vfgFields.forEach((field: any) => {
    if (field.type === 'AutoSuggest') { // service, route, consumer, consumer_group
      result.fields.push({
        [field.model.split('-')[0]]: {
          type: 'foreign',
          reference: field.entity,
          description: field.help,
        },
      })
    } else if (field.model === 'enabled') {
      result.fields.push({
        [field.model]: {
          type: 'boolean',
          default: true,
        },
      })

    } else if (field.model === 'instance_name') {
      result.fields.push({
        [field.model]: {
          type: 'string',
          description: field.help,
        },
      })
    } else if (field.model === 'protocols') {
      result.fields.push({
        [field.model]: {
          type: 'set',
          elements: {
            type: 'string',
            one_of: field.values.map((v: any) => v.value),
          },
          default: [...field.default],
        },
      })
    } else if (field.model === 'tags') {
      result.fields.push({
        [field.model]: {
          type: 'set',
          elements: {
            type: 'string',
          },
        },
      })
    } else {
      throw new Error(`Unsupported VFG field type '${field.type}' for model '${field.model}'`)
    }
  })
  return result
})

/**
 * Avoid passing freeform data that it can't handle. e.g. `scope`, `update_time`
 * freeform will pass these unknown values back through the update method, resulting in the data being overwritten when it is eventually merged with the vfg's data
 */
const prunedData = computed(() => {
  const ffDataKeys: Array<keyof FreeFormPluginData> = [
    // plugin specific config
    'config',
    'partials',
    '__ui_data',

    // general info
    'enabled',
    'protocols',
    'instance_name',
    'tags',

    // scope
    'consumer',
    'consumer_group',
    'route',
    'service',
  ]
  return pick(props.model, ffDataKeys) as Partial<T>
})


const scopeFields = computed<Array<'service' | 'route' | 'consumer' | 'consumer_group'>>(() => {
  return scopeEntitiesSchema.value?.fields.map((field: any) => field.model.split('-')[0]) ?? []
})

// Cache of scope-related fields to restore when toggling scoped on/off
const scopesCache = ref(pick(prunedData.value, scopeFields.value))

// `scopeIds` is not reactive. Initialize `scoped` in one shot.
const scoped = ref(Object.values(scopesCache.value).some(hasScopeId))
const moreCollapsed = ref(true)

const formRef = useTemplateRef('form')
let skipUpdateScopeCache = false

function handleScopeChange() {
  if (!formRef.value) return

  const { getInnerData, setInnerData } = formRef.value
  const currentData = getInnerData() as T
  const nextData = { ...currentData }

  if (scoped.value) {
    // restore cached scope ids
    scopeFields.value.forEach((field) => {
      nextData[field] = scopesCache.value[field] ?? null
    })
  } else {
    // clear scope ids
    scopeFields.value.forEach((field) => {
      nextData[field] = null
    })
  }

  skipUpdateScopeCache = true
  setInnerData(nextData)

  // Prevent updating the cache right after clearing it
  nextTick(() => {
    skipUpdateScopeCache = false
  })
}

function handleDataChange(value: T) {
  if (!skipUpdateScopeCache) {
    updateScopeCache(value)
  }

  // Update scoped state based on current form data from code editor mode
  if (editorMode === 'code') {
    // Check if at least one scope-related field is filled
    const nextScoped = scopeFields.value.some((field) => hasScopeId(value[field]))

    // Update scoped state if it differs from the current state
    if (nextScoped !== scoped.value) {
      scoped.value = nextScoped
    }
  }

  props.onFormChange(value)
}

function updateScopeCache(value: T) {
  scopeFields.value.forEach((field) => {
    const val = value[field]
    if (has(val, 'id') && val.id != null) {
      (scopesCache.value[field] as { id: string }) = val
    } else {
      (scopesCache.value[field] as null) = null
    }
  })
}

function hasScopeId(value: any): value is { id: string } {
  return has(value, 'id') && value.id != null
}
</script>

<style lang="scss" scoped>
.ff-standard-layout {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;

  .scope {
    display: flex;
    gap: $kui-space-50;
  }

  :deep(.form-group) {
    margin-bottom: $kui-space-70;
  }
}
</style>
