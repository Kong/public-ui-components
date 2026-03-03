<template>
  <div class="ff-form-pinned-fields">
    <VueFormGenerator
      :model="formModel"
      :options="formOptions"
      :schema="pinnedSchema"
      @model-updated="onModelUpdated"
    />
  </div>

  <KCollapse
    v-model="configCollapse"
    class="ff-form-config-fields"
  >
    <template #title>
      {{ t('plugins.form.grouping.plugin_configuration.title') }}
    </template>
    <template #visible-content>
      {{ t('plugins.form.grouping.plugin_configuration.description') }}
    </template>

    <div class="ff-form-config-form">
      <slot
        class="ff-form"
        :data="prunedData"
        :schema="freeFormSchema"
        @change="onFormChange"
      />
    </div>
  </KCollapse>
</template>

<script lang="ts">
export type PluginFormWrapperProps<T extends FreeFormPluginData = FreeFormPluginData> = {
  schema: FormSchema
  formSchema: any
  model: T
  formModel: Record<string, any>
  formOptions: any
  isEditing: boolean
  onModelUpdated: (value: any, model: string) => void
  onFormChange: (value: T) => void
}

export type ConfigFormProps<T extends FreeFormPluginData = FreeFormPluginData> = {
  schema: FormSchema
  data: Record<string, any>
  onChange: (value: T) => void
}
</script>

<script setup lang="ts" generic="T extends FreeFormPluginData = FreeFormPluginData">
import { pick } from 'lodash-es'
import { computed, inject, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import { VueFormGenerator } from '@kong-ui-public/forms'
import { KCollapse } from '@kong/kongponents'
import english from '../../../locales/en.json'
import type { FormSchema } from '../../../types/plugins/form-schema'
import type { FreeFormPluginData } from '../../../types/plugins/free-form'
import { FEATURE_FLAGS } from '../../../constants'

const { t } = createI18n<typeof english>('en-us', english)
const enableConditionField = inject<boolean>(FEATURE_FLAGS.KM_2306_CONDITION_FIELD_314, false)

const props = defineProps<PluginFormWrapperProps<T>>()

const slots = defineSlots<{
  default: (props: ConfigFormProps<T>) => any
}>()

function usePickedSchema(keys: MaybeRefOrGetter<string[]>) {
  return computed(() => ({
    fields: toValue(keys)
      .map(key => props.formSchema?.fields.find((field: { model: string }) => field.model === key))
      .filter(Boolean),
  }))
}

const PINNED_FIELD_KEYS = ['enabled', 'selectionGroup']

const pinnedSchema = usePickedSchema(PINNED_FIELD_KEYS)

const FREE_FORM_SCHEMA_KEYS = ['config', 'protocols']
const freeFormSchema = computed(() => {
  const result = props.schema
  result.fields = result.fields.filter(item => FREE_FORM_SCHEMA_KEYS.includes(Object.keys(item)[0]))

  result.fields.unshift({
    instance_name: {
      type: 'string',
      description: t('plugins.form.fields.instance_name.help'),
    },
  }, {
    tags: {
      type: 'set',
      default: [],
      description: t('plugins.form.fields.tags.help'),
      elements: {
        type: 'string',
      },
    },
  })

  const protocolsField = result.fields.find(item => Object.keys(item)[0] === 'protocols')
  if (protocolsField) {
    protocolsField.protocols.help = protocolsField.protocols.default
      ? t('plugins.form.fields.protocols.placeholderWithDefaultValues', {
        protocols: protocolsField.protocols.default.join(', '),
      })
      : t('plugins.form.fields.protocols.placeholder')
    protocolsField.protocols.description = t('plugins.form.fields.protocols.help')
  }

  if (enableConditionField) {
    result.fields.push({
      condition: {
        type: 'string',
        description: t('plugins.form.fields.condition.help'),
      },
    })
  }

  return result
})

const configCollapse = ref(false)

/**
 * Avoid passing freeform data that it can't handle. e.g. `scope`, `update_time`
 * freeform will pass these unknown values back through the update method, resulting in the data being overwritten when it is eventually merged with the vfg's data
 */
const prunedData = computed(() => {
  const ffDataKeys: Array<keyof PluginFormWrapperProps<T>['model']> = [
    'config',
    'instance_name',
    ...(enableConditionField ? ['condition' as const] : []),
    'partials',
    'protocols',
    'tags',
    '__ui_data',
  ]
  return pick(props.model, ffDataKeys)
})
</script>

<style lang="scss" scoped>
.ff-form-config-fields {
  border-top: $kui-border-width-10 solid $kui-color-border;
  margin-top: $kui-space-80;
  padding-top: $kui-space-80;
}

.ff-form-config-form {
  margin: $kui-space-100 0;

  & > * {
    display: flex;
    flex-direction: column;
    gap: $kui-space-100;
  }
}

:deep(.k-label) {
  font-weight: $kui-font-weight-medium;
}
</style>
