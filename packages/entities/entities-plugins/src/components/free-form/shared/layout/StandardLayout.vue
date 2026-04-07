<template>
  <Form
    ref="form"
    class="ff-standard-layout"
    :config="realFormConfig"
    :data="(prunedData as T)"
    :data-instance-id="instanceId"
    :data-plugin-name="pluginName"
    data-testid="ff-standard-layout-form"
    :render-rules="renderRules"
    :schema="freeFormSchema"
    tag="div"
    @change="handleDataChange"
  >
    <!-- global field templates -->
    <template #[FIELD_RENDERERS]>
      <!-- Redis partial selector -->
      <FieldRenderer :match="({ path }) => path === redisPartialInfo?.redisPath?.value">
        <RedisSelector :is-konnect-managed-redis-enabled="props.isKonnectManagedRedisEnabled ?? false" />
      </FieldRenderer>

      <!-- Custom field renderers from consuming components -->
      <slot name="field-renderers" />
    </template>

    <template v-if="editorMode === 'form'">
      <!-- Plugin scope -->
      <EntityFormBlock
        data-testid="form-section-plugin-scope"
        :description="generalInfoDescription ?? t('plugins.form.sections.plugin_scope.description')"
        :step="1"
        :title="generalInfoTitle ?? t('plugins.form.sections.plugin_scope.title')"
      >
        <component
          :is="scopeSchema?.disabled ? KTooltip : 'div'"
          v-bind="scopeWrapperAttrs"
        >
          <div class="radio-group">
            <KRadio
              v-model="scoped"
              card
              card-orientation="horizontal"
              v-bind="radioGroup[0]"
              :disabled="scopeSchema?.disabled"
              :selected-value="false"
              @update:model-value="handleScopeChange"
            />
            <KRadio
              v-if="radioGroup[1]"
              v-model="scoped"
              card
              card-orientation="horizontal"
              v-bind="radioGroup[1]"
              :disabled="scopeSchema?.disabled"
              :selected-value="true"
              @update:model-value="handleScopeChange"
            />
          </div>
        </component>
        <div
          v-if="scopeEntitiesSchema"
          v-show="scoped"
          class="scope-detail"
        >
          <ScopeEntityField
            v-for="scopeField in scopeEntityFields"
            :key="scopeField.name"
            :disabled="scopeField.disabled"
            :disabled-tooltip="scopeField.disabledTooltip"
            :entity="scopeField.entity"
            :fields="scopeField.fields"
            :help="scopeField.help"
            :label="scopeField.label"
            :label-field="scopeField.labelField"
            :name="scopeField.name"
            :placeholder="scopeField.placeholder"
          />
        </div>

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

      <!-- Plugin configuration -->
      <EntityFormBlock
        data-testid="form-section-plugin-config"
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

      <!-- General information -->
      <EntityFormBlock
        data-testid="form-section-general-info"
        :description="t('plugins.form.sections.plugin_general_info.description')"
        :step="3"
        :title="t('plugins.form.sections.general_info.title')"
      >
        <SwitchField
          v-if="freeFormFieldNames.has('enabled')"
          :disabled-text="t('plugins.form.fields.plugin_status.text_off')"
          :enabled-text="t('plugins.form.fields.plugin_status.text_on')"
          :label="t('plugins.form.fields.plugin_status.label')"
          name="enabled"
        />

        <StringField
          v-if="freeFormFieldNames.has('instance_name')"
          :label="t('plugins.form.fields.instance_name.label')"
          name="instance_name"
          :placeholder="t('plugins.form.fields.instance_name.placeholder')"
        />

        <StringArrayField
          v-if="freeFormFieldNames.has('tags')"
          :help="t('plugins.form.fields.tags.help')"
          name="tags"
          :placeholder="t('plugins.form.fields.tags.placeholder')"
        />

        <Field
          v-if="freeFormFieldNames.has('protocols')"
          name="protocols"
        />

        <KCollapse
          v-if="!!freeFormSchema.fields.find(f => Object.keys(f)[0] === 'condition')"
          v-model="advancedCollapsed"
          data-testid="view-general-info-additional-settings"
          :trigger-label="advancedCollapsed ? t('plugins.form.grouping.advanced_parameters.view') : t('plugins.form.grouping.advanced_parameters.hide')"
        >
          <ConditionField />
        </KCollapse>
      </EntityFormBlock>
    </template>

    <EntityFormBlock
      v-if="editorMode === 'code'"
      :description="t('plugins.form.sections.code_mode.description')"
      :title="t('plugins.form.sections.code_mode.title')"
    >
      <slot name="code-editor">
        <CodeEditor />
      </slot>
    </EntityFormBlock>
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
  isEditing: boolean
  /** Emits the final submission payload to the parent, the payload will be merged with the `formModel` but it has high override priority */
  onFormChange: (value: Partial<T>, fields?: string[]) => void
  onValidityChange?: (event: PluginValidityChangeEvent) => void
  editorMode?: 'form' | 'code'
  /** FreeForm configuration */
  formConfig?: FormConfig<T>
  renderRules?: RenderRules
  pluginName: string
  /** Konnect-managed Redis UI, from plugin form config */
  isKonnectManagedRedisEnabled?: boolean
}
</script>

<script setup lang="ts" generic="T extends FreeFormPluginData">
import { computed, inject, nextTick, ref, useTemplateRef, useId } from 'vue'
import { EntityFormBlock } from '@kong-ui-public/entities-shared'
import { has, pick } from 'lodash-es'
import { KRadio, KTooltip } from '@kong/kongponents'
import Form from '../Form.vue'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { PluginValidityChangeEvent } from '../../../../types'
import SwitchField from '../SwitchField.vue'
import ScopeEntityField from '../ScopeEntityField.vue'
import type { FormConfig, RenderRules } from '../types'
import FieldRenderer from '../FieldRenderer.vue'
import { REDIS_PARTIAL_INFO } from '../const'
import RedisSelector from '../RedisSelector.vue'
import { FIELD_RENDERERS, useSchemaExposer } from '../composables'
import Field from '../Field.vue'
import StringArrayField from '../StringArrayField.vue'
import StringField from '../StringField.vue'
import CodeEditor from '../CodeEditor.vue'
import ConditionField from './ConditionField.vue'
import useI18n from '../../../../composables/useI18n'

const FREE_FORM_CONTROLLED_FIELDS: Array<keyof FreeFormPluginData> = [
  // plugin specific config
  'config',
  'partials',
  '__ui_data',

  // general info
  'enabled',
  'protocols',
  'instance_name',
  'condition',
  'tags',

  // scope
  'consumer',
  'consumer_group',
  'route',
  'service',
]

const instanceId = useId()

const { i18n: { t } } = useI18n()

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
  'field-renderers'?: () => any
}>()

const realFormConfig = computed(() => {
  return props.formConfig ?? {
    hasValue: (data?: T): boolean => !!data && Object.keys(data).length > 0,
    prepareFormData: (data: T): Partial<T> => {
      if (props.isEditing) return data

      // Init scope-related fields from formModel when creating a new plugin
      return { ...data, ... getScopesFromFormModel() }
    },
  }
})

const scopeWrapperAttrs = computed(() => {
  if (scopeSchema.value?.disabled) {
    return {
      class: 'disabled-scope',
      maxWidth: '300',
      text: t('plugins.form.scoping.disable_global_radio'),
    }
  }
  return { class: 'scope' }
})

interface LegacyFormSchemaField {
  model: string
  type: string
  fields: LegacyFormSchemaField[]
  label?: string
  description?: string
  disabled?: boolean
  disabledTooltip?: string
  labelField?: string
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

const scopeSchema = computed(() => {
  return flattenFormSchemaFields.value.find(field => field.type === 'selectionGroup')
})

const radioGroup = computed(() => {
  return (scopeSchema.value?.fields || []).map(({ label, description }) => ({ label, description }))
})

const scopeEntitiesSchema = computed(() => {
  return scopeSchema.value?.fields?.[1]
})

const scopeEntityFields = computed(() => {
  return (scopeEntitiesSchema.value?.fields ?? []).map((field: any) => ({
    name: field.model.split('-')[0],
    entity: field.entity,
    fields: field.inputValues?.fields,
    label: field.label,
    placeholder: field.placeholder,
    help: field.help,
    disabled: field.disabled,
    disabledTooltip: field.disabledTooltip,
    labelField: field.labelField,
  }))
})

const MORE_FIELDS = ['instance_name', 'protocols', 'tags', 'condition']
const FREE_FORM_SCHEMA_KEYS = ['config']
const freeFormSchema = computed(() => {
  const result: FormSchema = {
    type: 'record',
    fields: props.schema.fields.filter(item => FREE_FORM_SCHEMA_KEYS.includes(Object.keys(item)[0])),
  }

  // append VFG fields to the freeform schema
  const enabledField = flattenFormSchemaFields.value.find(field => field.model === 'enabled')
  const vfgFields = [
    // enabled field
    ...(enabledField ? [enabledField] : []),
    // scope fields
    ...(scopeEntitiesSchema.value?.fields ?? []),
    // general info fields
    ...flattenFormSchemaFields.value.filter(field => MORE_FIELDS.includes(field.model!)),
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

    } else if (field.model === 'instance_name' || field.model === 'condition') {
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
          required: field.required,
          description: field.help,
          help: field.default
            ? t('plugins.form.fields.protocols.placeholderWithDefaultValues', {
              protocols: field.default.join(', '),
            })
            : t('plugins.form.fields.protocols.placeholder'),
        },
      })
    } else if (field.model === 'tags') {
      result.fields.push({
        [field.model]: {
          type: 'set',
          elements: {
            type: 'string',
          },
          description: field.help,
          default: field.default || [],
        },
      })
    } else {
      throw new Error(`Unsupported VFG field type '${field.type}' for model '${field.model}'`)
    }
  })
  return result
})

const freeFormFieldNames = computed(() =>
  new Set(freeFormSchema.value.fields.map(f => Object.keys(f)[0])),
)

/**
 * Avoid passing freeform data that it can't handle. e.g. `scope`, `update_time`
 * freeform will pass these unknown values back through the update method, resulting in the data being overwritten when it is eventually merged with the vfg's data
 */
const prunedData = computed(() => {
  return pick(props.model, FREE_FORM_CONTROLLED_FIELDS) as Partial<T>
})

/**
 * The scope-related field keys in VFG data model, e.g. `service-id`, `route-id`, `consumer-id`, `consumer_group-id`
 */
const formModelScopeFields = computed<string[]>(() => {
  return scopeEntitiesSchema.value?.fields.map((field: any) => field.model) ?? []
})

type ScopeFieldName = 'service' | 'route' | 'consumer' | 'consumer_group'

/**
 * The scope-related field keys in freeform data model, e.g. `service`, `route`, `consumer`, `consumer_group`
 */
const scopeFields = computed<ScopeFieldName[]>(() => {
  return formModelScopeFields.value.map(field => field.split('-')[0] as ScopeFieldName)
})

// Cache of scope-related fields to restore when toggling scoped on/off
const scopesCache = ref(
  props.isEditing
    ? pick(prunedData.value, scopeFields.value)
    // For new plugin, initialize from formModel
    : getScopesFromFormModel(),
)

// `scopeIds` is not reactive. Initialize `scoped` in one shot.
const scoped = ref(Object.values(scopesCache.value).some(hasScopeId))

const formRef = useTemplateRef('form')
let skipUpdateScopeCache = false

function handleScopeChange() {
  if (!formRef.value) return

  const { getRawValue, setValue } = formRef.value
  const currentData = getRawValue() as T
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
  setValue(nextData)

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

  props.onFormChange(value, FREE_FORM_CONTROLLED_FIELDS)
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

function getScopesFromFormModel(): Partial<T> {
  const data: Partial<T> = {}
  formModelScopeFields.value.forEach(scopeField => {
    if (props.formModel[scopeField]) {
      const fieldName = scopeField.split('-')[0]
      if (!fieldName) return
      // Transfer 'service-id' to 'service': { id: '...' }
      data[fieldName as keyof T] = { id: props.formModel[scopeField] } as any
    }
  })
  return data
}

useSchemaExposer(freeFormSchema, instanceId)

const advancedCollapsed = ref(true)
</script>

<style lang="scss" scoped>
.ff-standard-layout {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-80, $kui-space-80);

  .radio-group {
    width: 100%;
  }

  .scope .radio-group,
  .disabled-scope :deep(.popover-trigger-wrapper) .radio-group {
    display: grid;
    gap: var(--kui-space-50, $kui-space-50);
    grid-template-columns: repeat(2, 1fr);
  }

  :deep(.form-group) {
    margin-bottom: var(--kui-space-70, $kui-space-70);
  }
}
</style>
