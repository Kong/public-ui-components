<template>
  <DynamicLayout
    v-bind="props"
    :field-renderers="fieldRenderers"
    :on-form-change="handleFormChange"
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

import type { FieldRenderer } from '../../shared/types'
import type { PluginFormLayoutProps as Props } from '../../shared/layout/provider'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'

const props = defineProps<Props>()

// `limit` and `custom_key` are expressible; gate their expression editors
// with the rest of the 3.16 features, leaving the fields themselves.
const { gatedSchema } = useExpressionMode(() => props.schema)

/**
 * `custom_key` overrides the counter key rather than a limit, so its expression
 * gets its own example and help text. Registered rather than placed, so the
 * field is rendered by the form like any other.
 */
const fieldRenderers: FieldRenderer[] = [
  {
    match: 'config.custom_key',
    component: CustomKeyField,
  },
]

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
