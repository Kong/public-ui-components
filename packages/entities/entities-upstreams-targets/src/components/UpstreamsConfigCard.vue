<template>
  <EntityBaseConfigCard
    :config="config"
    :config-card-doc="configCardDoc"
    :entity-type="SupportedEntityType.Upstream"
    :fetch-url="fetchUrl"
    :hide-title="hideTitle"
    @fetch:error="(err: any) => emit('fetch:error', err)"
    @fetch:success="(entity: any) => emit('fetch:success', entity)"
    @loading="(val: boolean) => emit('loading', val)"
  >
    <template #default="{ record, config: viewConfig }">
      <UpstreamsConfigCardView
        v-bind="props"
        :config="viewConfig"
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
      </UpstreamsConfigCardView>
    </template>
  </EntityBaseConfigCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { AxiosError } from 'axios'
import { EntityBaseConfigCard, SupportedEntityType } from '@kong-ui-public/entities-shared'
import type { KongManagerUpstreamsEntityConfig, KonnectUpstreamsEntityConfig } from '../types'
import endpoints from '../upstreams-endpoints'
import UpstreamsConfigCardView from './UpstreamsConfigCardView.vue'
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectUpstreamsEntityConfig | KongManagerUpstreamsEntityConfig>,
    required: true,
    validator: (config: KonnectUpstreamsEntityConfig | KongManagerUpstreamsEntityConfig): boolean => {
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
