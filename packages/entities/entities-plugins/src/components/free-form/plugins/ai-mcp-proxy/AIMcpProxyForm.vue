<template>
  <StandardLayout v-bind="props">
    <template #field-renderers>
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
    </template>

    <ObjectField
      as-child
      name="config"
      reset-label-path="reset"
    />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import StandardLayout from '../../shared/layout/StandardLayout.vue'
import ArrayField from '../../shared/ArrayField.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import ObjectField from '../../shared/ObjectField.vue'
import composables from '../../../../composables'

import type { Props } from '../../shared/layout/StandardLayout.vue'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = composables.useI18n()
</script>
