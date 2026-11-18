<template>
  <DynamicLayout v-bind="props">
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ genericPath }) => CEL_FIELDS.includes(genericPath)"
      >
        <PluginCelField
          v-bind="slotProps"
          :plugins="ACL_RULE_CEL"
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
import { provide } from 'vue'
import { kongAclRule, kongFallback } from '@kong-ui-public/monaco-editor/languages/cel'
import PluginCelField from '../../components/PluginCelField'
import DynamicLayout from '../../layout/DynamicLayout.vue'
import { ArrayField, FieldRenderer, ObjectField, StringArrayField, MapField } from '@kong-ui-public/freeform'
import composables from '../../../../composables'

import type { PluginFormLayoutProps as Props } from '../../layout/provider'

const props = defineProps<Props>()

const CEL_FIELDS = [
  'config.default_acl.*.allow_when.*',
  'config.default_acl.*.deny_when.*',
  'config.tools.*.acl.allow_when.*',
  'config.tools.*.acl.deny_when.*',
]
const ACL_RULE_CEL = [kongAclRule(), kongFallback()]

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = composables.useI18n()
</script>
