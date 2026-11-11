<template>
  <DynamicLayout
    v-bind="props"
    :plugin-config-description="t('plugins.free-form.kong-circuit-breaker.sections.plugin_config.description')"
  >
    <ConfigForm />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../../const'
import DynamicLayout from '../../layout/DynamicLayout.vue'
import ConfigForm from './ConfigForm.vue'
import useI18n from '../../../../composables/useI18n'

import type { PluginFormLayoutProps as Props } from '../../layout/provider'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = useI18n()
</script>
