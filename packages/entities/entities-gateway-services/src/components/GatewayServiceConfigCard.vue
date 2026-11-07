<template>
  <EntityBaseConfigCard
    :config="config"
    :config-card-doc="configCardDoc"
    :entity-type="SupportedEntityType.GatewayService"
    :fetch-url="fetchUrl"
    :hide-title="hideTitle"
    @fetch:error="(err: any) => emit('fetch:error', err)"
    @fetch:success="(entity: any) => emit('fetch:success', entity)"
    @loading="(val: boolean) => emit('loading', val)"
  >
    <template #default="{ record, config: viewConfig }">
      <GatewayServiceConfigCardView
        :config="viewConfig"
        :hide-title="hideTitle"
        :record="record"
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
      </GatewayServiceConfigCardView>
    </template>
  </EntityBaseConfigCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { AxiosError } from 'axios'
import { EntityBaseConfigCard, SupportedEntityType } from '@kong-ui-public/entities-shared'
import type { KongManagerGatewayServiceEntityConfig, KonnectGatewayServiceEntityConfig } from '../types'
import endpoints from '../gateway-services-endpoints'
import GatewayServiceConfigCardView from './GatewayServiceConfigCardView.vue'
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectGatewayServiceEntityConfig | KongManagerGatewayServiceEntityConfig>,
    required: true,
    validator: (config: KonnectGatewayServiceEntityConfig | KongManagerGatewayServiceEntityConfig): boolean => {
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

</script>
