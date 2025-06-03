<template>
  <div class="ff-standard-layout">
    <FormSection
      :description="t('plugins.form.sections.general_info.description')"
      :step="1"
      :title="t('plugins.form.sections.general_info.title')"
    >
      <div class="enabled">
        <VueFormGenerator
          :model="formModel"
          :options="formOptions"
          :schema="enabledSchema"
          @model-updated="onModelUpdated"
        />
      </div>
      <div class="scope">
        <KRadio
          v-model="scoped"
          card
          card-orientation="horizontal"
          v-bind="radioGroup[0]"
          :selected-value="false"
        />
        <KRadio
          v-model="scoped"
          card
          card-orientation="horizontal"
          v-bind="radioGroup[1]"
          :selected-value="true"
        />
      </div>
      <div
        v-if="scoped"
        class="scope-detail"
      >
        <VueFormGenerator
          :model="formModel"
          :options="formOptions"
          :schema="scopeEntitiesSchema"
          @model-updated="handleScopeUpdate"
        />
      </div>
      <KCollapse
        v-model="moreCollapsed"
        trigger-label="Show more"
      >
        <VueFormGenerator
          :model="formModel"
          :options="formOptions"
          :schema="moreFieldsSchema"
          @model-updated="onModelUpdated"
        />
      </KCollapse>
    </FormSection>
    <FormSection
      :description="t('plugins.form.sections.plugin_config.description')"
      :step="2"
      :title="t('plugins.form.sections.plugin_config.title')"
    >
      <slot
        :data="pruneData(model)"
        :schema="freeFormSchema"
        @change="onFormChange"
      />
    </FormSection>
  </div>
</template>

<script lang="ts">
export type Props<T extends FreeFormPluginData> = {
  schema: FormSchema
  formSchema: any
  model: T
  formModel: Record<string, any>
  formOptions: any
  isEditing: boolean
  onModelUpdated: (value: any, model: string) => void
  onFormChange: (value: T) => void
  onValidityChange?: (event: PluginValidityChangeEvent) => void
}

export type ConfigFormProps<T> = {
  schema: FormSchema
  data: Record<string, any>
  onChange: (value: T) => void
}
</script>

<script setup lang="ts" generic="T extends FreeFormPluginData">
import { computed, provide, ref, watch } from 'vue'
import { pick } from 'lodash-es'
import { KRadio } from '@kong/kongponents'
import FormSection from '../FormSection.vue'
import english from '../../../../locales/en.json'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { createI18n } from '@kong-ui-public/i18n'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'
import type { PluginValidityChangeEvent } from '../../../../types'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<T>>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
} & {
  default: (props: ConfigFormProps<T>) => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const enabledSchema = computed(() => {
  return {
    fields: props.formSchema?.fields.filter((field: { model: string }) => field.model === 'enabled'),
  }
})

const scopeSchema = computed(() => {
  return props.formSchema?.fields.find((field: { model: string }) => field.model === 'selectionGroup')
})

const radioGroup = computed(() => {
  return (scopeSchema.value.fields || []).map(({ label, description }: { label: string, description: string }) => ({ label, description }))
})

const scopeEntitiesSchema = computed(() => {
  return scopeSchema.value.fields[1]
})

const moreFieldsSchema = computed(() => {
  const fields = ['instance_name', 'protocols', 'tags']

  return {
    fields: props.formSchema?.fields.filter((field: { model: string }) => fields.includes(field.model)),
  }
})

const FREE_FORM_SCHEMA_KEYS = ['config']
const freeFormSchema = computed(() => {
  const result = props.schema
  result.fields = result.fields.filter(item => FREE_FORM_SCHEMA_KEYS.includes(Object.keys(item)[0]))

  return result
})

/**
 * Avoid passing freeform data that it can't handle. e.g. `scope`, `update_time`
 * freeform will pass these unknown values back through the update method, resulting in the data being overwritten when it is eventually merged with the vfg's data
 */
function pruneData(data: Props<T>['model']) {
  const ffDataKeys: (keyof Props<T>['model'])[] = [
    'config',
    'partials',
  ]
  return pick(data, ffDataKeys)
}

const scoped = ref(false)
const moreCollapsed = ref(true)

const scopeIds: Record<string, string | null> = pick(props.formModel, [
  'service-id',
  'route-id',
  'consumer-id',
  'consumer_group-id',
])

function handleScopeUpdate(value: any, model: string) {
  scopeIds[model] = value

  props.onModelUpdated(value, model)
}

watch(scoped, (value: boolean) => {
  if (!value) {
    Object.keys(scopeIds).forEach(key => {
      props.onModelUpdated('', key)
    })
  } else {
    Object.keys(scopeIds).forEach(key => {
      props.onModelUpdated(scopeIds[key], key)
    })
  }
})
</script>

<style lang="scss" scoped>
.ff-standard-layout {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
  padding-bottom: $kui-space-80;

  .scope {
    display: flex;
    gap: $kui-space-50;
  }

  :deep(.form-group) {
    margin-bottom: $kui-space-70;
  }
}
</style>
