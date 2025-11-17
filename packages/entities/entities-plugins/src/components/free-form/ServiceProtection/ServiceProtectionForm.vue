<template>
  <PluginFormWrapper
    v-slot="configFormProps"
    v-bind="props"
  >
    <ConfigForm
      v-bind="configFormProps"
    />
  </PluginFormWrapper>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import PluginFormWrapper from '../shared/PluginFormWrapper.vue'

import type { PluginFormWrapperProps } from '../shared/PluginFormWrapper.vue'

const props = defineProps<PluginFormWrapperProps<any>>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
