<template>
  <DynamicLayout
    v-bind="props"
    :field-renderers="fieldRenderers"
    :render-rules="renderRules"
    :schema="gatedSchema"
  >
    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import CustomKeyField from '../_shared/CustomKeyField.vue'
import DynamicLayout from '../../shared/layout/DynamicLayout.vue'
import { useExpressionMode } from '../_shared/use-expression-mode'

import type { PluginFormLayoutProps as Props } from '../../shared/layout/provider'
import type { FieldRenderer, RenderRules } from '../../shared/types'

const props = defineProps<Props>()

// `second`..`year` and `custom_key` are expressible; gate them with the rest
// of the 3.16 features.
// `second`..`year` and `custom_key` are expressible; gate their expression
// editors with the rest of the 3.16 features, leaving the fields themselves.
const { gatedSchema } = useExpressionMode(() => props.schema)

/**
 * `custom_key` overrides the counter key rather than a limit, so its expression
 * gets its own example and help text. Registered rather than placed, so the
 * field keeps its position among the auto-rendered siblings.
 */
const fieldRenderers: FieldRenderer[] = [
  {
    match: 'config.custom_key',
    component: CustomKeyField,
  },
]

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
