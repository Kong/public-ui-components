<template>
  <DynamicLayout
    v-bind="props"
    :render-rules="renderRules"
  >
    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import DynamicLayout from '../../shared/layout/DynamicLayout.vue'

import type { PluginFormLayoutProps as Props } from '../../shared/layout/provider'
import type { RenderRules } from '../../shared/types'

const props = defineProps<Props>()

// A custom component owns its own render rules, so these live here rather than
// in the plugin config.
const renderRules: RenderRules = {
  bundles: [
    ['config.policy', 'config.redis'],
  ],
  dependencies: {
    'config.redis': ['config.policy', 'redis'],
  },
}

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
