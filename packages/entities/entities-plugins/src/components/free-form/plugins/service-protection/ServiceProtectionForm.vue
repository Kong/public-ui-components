<template>
  <DynamicLayout
    v-bind="props"
    :on-form-change="handleFormChange"
    :render-rules="renderRules"
  >
    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import DynamicLayout from '../../layout/DynamicLayout.vue'

import type { RenderRules } from '@kong-ui-public/freeform'
import type { PluginFormLayoutProps as Props } from '../../layout/provider'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'

const props = defineProps<Props>()

// `config.redis` is rendered by the RedisSelector PluginConfigurationForm registers for
// the partial's path; these rules keep it right under `strategy` and show it only for redis.
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
   * If it is null, we should delete it from the config object.
   */
  if (value.config?.namespace === null) {
    delete value.config.namespace
  }
  props.onFormChange(value, fields)
}
</script>
