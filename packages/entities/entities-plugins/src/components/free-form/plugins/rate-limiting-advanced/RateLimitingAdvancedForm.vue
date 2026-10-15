<template>
  <DynamicLayout
    v-bind="props"
    :on-form-change="handleFormChange"
    :render-rules="renderRules"
  >
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.custom_key'"
      >
        <CustomKeyField v-bind="slotProps" />
      </FieldRenderer>

      <!-- Typed as an array, which would otherwise render one select per item -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.compound_identifier'"
      >
        <EnumField
          v-bind="slotProps"
          multiple
        />
      </FieldRenderer>
    </template>

    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import CustomKeyField from './CustomKeyField.vue'
import { EnumField, FieldRenderer } from '@kong-ui-public/freeform'
import DynamicLayout from '../../layout/DynamicLayout.vue'

import type { RenderRules } from '@kong-ui-public/freeform'
import type { PluginFormLayoutProps as Props } from '../../layout/provider'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'

const props = defineProps<Props>()

// `config.redis` is rendered by the RedisSelector that PluginConfigurationForm registers
// for the partial's path; these rules keep it right under `strategy` and show it only for redis.
const renderRules: RenderRules = {
  bundles: [
    ['config.strategy', 'config.redis'],
  ],
  dependencies: {
    'config.redis': ['config.strategy', 'redis'],
  },
}

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

function handleFormChange(value: Partial<FreeFormPluginData>, fields?: string[]) {
  /**
   * `namespace` can be undefined, but can't be null.
   * If it is null, we should delete it from the config object so the server auto-generates it.
   */
  if (value.config?.namespace === null) {
    delete value.config.namespace
  }

  props.onFormChange(value, fields)
}
</script>
