<template>
  <EntityBaseConfigCard
    :config="config"
    :config-card-doc="configCardDoc"
    :entity-type="SupportedEntityType.KeySet"
    :fetch-url="fetchUrl"
    :hide-title="hideTitle"
    @fetch:error="(err: any) => emit('fetch:error', err)"
    @fetch:success="(entity: any) => emit('fetch:success', entity)"
    @loading="(val: boolean) => emit('loading', val)"
  >
    <template #default="{ record, requestUrl }">
      <KeySetConfigCardView
        v-bind="props"
        :config="viewConfig"
        :record="record"
        :request-url="requestUrl"
      >
        <template
          v-for="slotKey in Object.keys($slots)"
          :key="slotKey"
          #[slotKey]="slotProps"
        >
          <slot
            :name="slotKey"
            v-bind="slotProps"
          />
        </template>
      </KeySetConfigCardView>
    </template>
  </EntityBaseConfigCard>
</template>

<script setup lang="ts">
import { getConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { AxiosError } from 'axios'
import { EntityBaseConfigCard, SupportedEntityType } from '@kong-ui-public/entities-shared'
import type { KongManagerKeySetEntityConfig, KonnectKeySetEntityConfig } from '../types'
import endpoints from '../key-sets-endpoints'
import KeySetConfigCardView from './KeySetConfigCardView.vue'
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectKeySetEntityConfig | KongManagerKeySetEntityConfig>,
    required: true,
    validator: (config: KonnectKeySetEntityConfig | KongManagerKeySetEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.entityId) return false
      return true
    },
  },
  /**
   * External link for documentation that determines visibility of Documentation button
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
})
const fetchUrl = computed<string>(() => endpoints.form[props.config.app].edit)

const viewConfig = computed(() => ({ ...props.config, enableDeckConfig: getConfigCardViewConfig(props.config).enableDeckConfig }))
</script>
