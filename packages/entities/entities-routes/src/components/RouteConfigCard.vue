<template>
  <EntityBaseConfigCard
    :config="config"
    :config-card-doc="configCardDoc"
    :entity-type="SupportedEntityType.Route"
    :fetch-url="fetchUrl"
    :hide-title="hideTitle"
    @fetch:error="(err: any) => emit('fetch:error', err)"
    @fetch:success="handleSuccess"
    @loading="(val: boolean) => emit('loading', val)"
  >
    <template #default="{ record, config: viewConfig }">
      <RouteConfigCardView
        v-bind="props"
        :config="viewConfig"
        :record="record"
        :service="{ id: internalServiceId, name: serviceName, loading: isServiceNameLoading }"
        @navigation-click="(id: string, entityType: any) => emit('navigation-click', id, entityType)"
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
      </RouteConfigCardView>
    </template>
  </EntityBaseConfigCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import { EntityBaseConfigCard, SupportedEntityType, useAxios } from '@kong-ui-public/entities-shared'
import type { KongManagerRouteEntityConfig, KonnectRouteEntityConfig } from '../types'
import endpoints from '../routes-endpoints'
import RouteConfigCardView from './RouteConfigCardView.vue'
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
  (e: 'navigation-click', id: string, entityType: string): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectRouteEntityConfig | KongManagerRouteEntityConfig>,
    required: true,
    validator: (config: KonnectRouteEntityConfig | KongManagerRouteEntityConfig): boolean => {
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
  /** The id of the service with which the route is associated */
  serviceId: {
    type: String as PropType<string | null>,
    required: false,
    default: null,
  },
})
const fetchUrl = computed<string>(
  () => endpoints.item[props.config?.app]?.[props.serviceId ? 'forGatewayService' : 'all']
    .replace(/{serviceId}/gi, props.serviceId ?? ''),
)
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const internalServiceId = ref('')
const serviceName = ref('')
const isServiceNameLoading = ref(false)
const fetchServiceName = computed<string>(() => endpoints.item[props.config.app]?.getService)

const handleSuccess = async (entity: any) => {
  internalServiceId.value = props.serviceId || entity?.service?.id
  emit('fetch:success', entity)

  if (!internalServiceId.value) {
    return
  }

  let url = `${props.config.apiBaseUrl}${fetchServiceName.value}`
  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  }

  url = url
    .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
    .replace(/{serviceId}/gi, internalServiceId.value || '')

  try {
    isServiceNameLoading.value = true
    // make the call to get ServiceName
    const { data } = await axiosInstance.get(url)
    serviceName.value = data?.name || data?.id
  } catch (err: any) {
    // emit this error for the host app
    emit('fetch:error', err)
  } finally {
    isServiceNameLoading.value = false
  }
}


</script>
