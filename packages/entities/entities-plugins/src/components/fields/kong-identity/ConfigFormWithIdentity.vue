<template>
  <StandardLayout v-bind="props">
    <ConfigFormContent />
  </StandardLayout>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import StandardLayout from '../../free-form/shared/layout/StandardLayout.vue'
import ConfigFormContent from './ConfigFormContent.vue'

import type { Props } from '../../free-form/shared/layout/StandardLayout.vue'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
