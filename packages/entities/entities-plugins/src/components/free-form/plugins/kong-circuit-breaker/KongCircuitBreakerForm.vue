<template>
  <DynamicLayout
    v-bind="props"
    :form-config="formConfig"
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

/** The shape `prepareFormData` reaches into; the rest stays schema-driven. */
interface CircuitBreakerFormData {
  config?: {
    policy_circuit?: { enabled?: boolean }
  }
}

const formConfig = {
  /**
   * A circuit breaker with both circuits off does nothing, and the Gateway
   * rejects it ("at least one of policy_circuit or latency_circuit must be
   * enabled"), so a new plugin starts with the policy circuit on. The schema
   * default is `false`; an existing plugin keeps whatever it was saved with.
   */
  prepareFormData: (data: CircuitBreakerFormData): CircuitBreakerFormData => {
    if (props.isEditing || !data?.config?.policy_circuit) return data

    return {
      ...data,
      config: {
        ...data.config,
        policy_circuit: { ...data.config.policy_circuit, enabled: true },
      },
    }
  },
}
</script>
