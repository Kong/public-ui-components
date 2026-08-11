<template>
  <DynamicLayout v-bind="props">
    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from './ConfigForm.vue'
import DynamicLayout from '../shared/layout/DynamicLayout.vue'

import type { PluginFormLayoutProps as Props } from '../shared/layout/provider'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
