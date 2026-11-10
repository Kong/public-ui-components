<template>
  <div class="kong-ui-entities-route-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Route"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="handleSuccess"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #service="{ row }">
        <!-- Loading -->
        <KSkeleton
          v-if="isServiceNameLoading"
          data-testid="service-name-loader"
          type="spinner"
        />
        <InternalLinkItem
          v-else-if="row.value && row.value.id === internalServiceId && serviceName"
          :item="{
            key: row.value.id,
            value: serviceName,
            type: ConfigurationSchemaType.LinkInternal,
          }"
          @navigation-click="() => $emit('navigation-click', row.value.id, 'services')"
        />
        <div
          v-else
        >
          {{ '-' }}
        </div>
      </template>
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import { createConfigCardSchema } from './config-card-schema'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import {
  useAxios,
  ConfigurationSchemaType,
  EntityBaseConfigCard,
  InternalLinkItem,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import endpoints from '../routes-endpoints'
import composables from '../composables'
import type { KongManagerRouteEntityConfig, KonnectRouteEntityConfig } from '../types'

import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
  (e: 'navigation-click', id: string, entityType: string): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
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

const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { i18n: { t } } = composables.useI18n()
const internalServiceId = ref('')
const serviceName = ref('')
const isServiceNameLoading = ref(false)
const fetchUrl = computed<string>(
  () => endpoints.item[props.config?.app]?.[props.serviceId ? 'forGatewayService' : 'all']
    .replace(/{serviceId}/gi, props.serviceId ?? ''),
)

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

const configSchema = createConfigCardSchema(t)
</script>
