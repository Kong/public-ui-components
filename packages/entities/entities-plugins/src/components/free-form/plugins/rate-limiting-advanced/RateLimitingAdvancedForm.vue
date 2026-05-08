<template>
  <StandardLayout
    v-bind="props"
    :on-form-change="handleFormChange"
  >
    <ConfigForm />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import StandardLayout from '../../shared/layout/StandardLayout.vue'

import type { Props } from '../../shared/layout/StandardLayout.vue'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

function handleFormChange(value: Partial<FreeFormPluginData>, fields?: string[]) {
  /**
   * `namespace` can be undefined, but can't be null.
   * If it is null, we should delete it from the config object so the server auto-generates it.
   */
  // if (value.config?.namespace === null) {
  //   delete value.config.namespace
  // }

  /**
   * `compound_identifier` should be null when empty, not an empty array.
   */
  if (Array.isArray(value.config?.compound_identifier) && value.config.compound_identifier.length === 0) {
    value.config.compound_identifier = null
  }
  props.onFormChange(value, fields)
}
</script>
