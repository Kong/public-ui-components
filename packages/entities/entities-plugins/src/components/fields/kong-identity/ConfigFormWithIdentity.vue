<template>
  <DynamicLayout v-bind="props">
    <ConfigFormContent />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import DynamicLayout from '../../free-form/shared/layout/DynamicLayout.vue'
import ConfigFormContent from './ConfigFormContent.vue'

import type { PluginFormLayoutProps as Props } from '../../free-form/shared/layout/provider'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
