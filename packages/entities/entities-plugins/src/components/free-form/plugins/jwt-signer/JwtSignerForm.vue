<template>
  <DynamicLayout
    v-bind="props"
    :render-rules="renderRules"
  >
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.access_token_keyset'"
      >
        <KeysetField
          v-bind="slotProps"
          scope="access"
        />
      </FieldRenderer>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.channel_token_keyset'"
      >
        <KeysetField
          v-bind="slotProps"
          scope="channel"
        />
      </FieldRenderer>
    </template>

    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'

import ConfigForm from '../../components/ConfigForm.vue'
import { FieldRenderer } from '@kong-ui-public/freeform'
import type { RenderRules } from '@kong-ui-public/freeform'
import DynamicLayout from '../../layout/DynamicLayout.vue'
import KeysetField from './KeysetField.vue'

import type { PluginFormLayoutProps as Props } from '../../layout/provider'

const props = defineProps<Props>()

const renderRules: RenderRules = {
  bundles: [
    ['config.access_token_signing', 'config.access_token_upstream_header', 'config.access_token_keyset'],
    ['config.channel_token_signing', 'config.channel_token_upstream_header', 'config.channel_token_keyset'],
  ],
}

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
