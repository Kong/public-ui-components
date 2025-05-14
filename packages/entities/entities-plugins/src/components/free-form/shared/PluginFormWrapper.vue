<template>
  <div class="sc-form-pinned-fields">
    <VueFormGenerator
      :model="formModel"
      :options="formOptions"
      :schema="pinnedSchema"
      @model-updated="onModelUpdated"
    />
  </div>

  <KCollapse
    v-model="configCollapse"
    class="sc-form-config-fields"
  >
    <template #title>
      {{ t('plugins.form.grouping.plugin_configuration.title') }}
    </template>
    <template #visible-content>
      {{ t('plugins.form.grouping.plugin_configuration.description') }}
    </template>

    <div class="sc-form-config-form">
      <slot
        :data="model"
        :schema="freeFormSchema"
        @change="onFormChange"
      />
    </div>
  </KCollapse>
</template>

<script lang="ts" generic="T">
export type Props<T> = {
  schema: FormSchema
  formSchema: any
  model: Record<string, any>
  formModel: Record<string, any>
  formOptions: any
  isEditing: boolean
  onModelUpdated: (value: any, model: string) => void
  onFormChange: (value: T) => void
}

export type ConfigFormProps<T> = {
  schema: FormSchema
  data: Record<string, any>
  onChange: (value: T) => void
}
</script>

<script setup lang="ts" generic="T">
import { computed, ref, toValue, provide, type MaybeRefOrGetter } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { VueFormGenerator } from '@kong-ui-public/forms'
import { KCollapse } from '@kong/kongponents'
import english from '../../../locales/en.json'
import type { FormSchema } from '../../../types/plugins/form-schema'

const { t } = createI18n<typeof english>('en-us', english)

const props = defineProps<Props<T>>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
} & {
  default: (props: ConfigFormProps<T>) => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

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
  return result
})

const configCollapse = ref(false)
</script>

<style lang="scss" scoped>
.sc-form-config-fields {
  border-top: $kui-border-width-10 solid $kui-color-border;
  margin-top: $kui-space-80;
  padding-top: $kui-space-80;
}

.sc-form-config-form {
  margin: $kui-space-100 0;
}

:deep(.rc-code textarea) {
  font-family: $kui-font-family-code !important;
}

:deep(.k-label) {
  font-weight: $kui-font-weight-medium;
}

:deep(.rc-config-form) {
  display: flex;
  flex-direction: column;
  gap: $kui-space-100;
}
</style>
