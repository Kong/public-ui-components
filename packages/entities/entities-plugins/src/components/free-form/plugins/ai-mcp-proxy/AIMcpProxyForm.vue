<template>
  <DynamicLayout v-bind="props">
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ genericPath }) => CEL_FIELDS.includes(genericPath)"
      >
        <component
          :is="language ? CelField : StringField"
          v-bind="slotProps"
          :language="language"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.default_acl'"
      >
        <ArrayField
          v-bind="slotProps"
          appearance="tabs"
          :item-label="(_, index) => t('plugins.free-form.ai-mcp-proxy.default_acl_item_label', { index: index + 1 })"
          sticky-tabs
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.tools'"
      >
        <ArrayField
          v-bind="slotProps"
          appearance="tabs"
          :item-label="(_, index) => t('plugins.free-form.ai-mcp-proxy.tool_item_label', { index: index + 1 })"
          sticky-tabs
        />
      </FieldRenderer>

      <FieldRenderer
        v-slot="slotProps"
        :match="({ genericPath }) => genericPath === 'config.tools.*.query' || genericPath === 'config.tools.*.headers'"
      >
        <MapField
          v-slot="{ keyId }"
          v-bind="slotProps"
          one-line
        >
          <StringArrayField
            :name="keyId"
            :placeholder="t('plugins.free-form.tag_helper')"
          />
        </MapField>
      </FieldRenderer>
    </template>

    <ObjectField
      as-child
      name="config"
      reset-label-path="reset"
    />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../../const'
import { computed, provide } from 'vue'
import DynamicLayout from '../../layout/DynamicLayout.vue'
import { ArrayField, CelField, FieldRenderer, ObjectField, StringArrayField, StringField, MapField, useCelExpression } from '@kong-ui-public/freeform'
import composables from '../../../../composables'

import type { PluginFormLayoutProps as Props } from '../../layout/provider'

const props = defineProps<Props>()
const { getSupportedLanguages } = useCelExpression(() => props.formConfig)
const language = computed(() => getSupportedLanguages('acl-rule')[0])

const CEL_FIELDS = [
  'config.default_acl.*.allow_when.*',
  'config.default_acl.*.deny_when.*',
  'config.tools.*.acl.allow_when.*',
  'config.tools.*.acl.deny_when.*',
]

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = composables.useI18n()
</script>
