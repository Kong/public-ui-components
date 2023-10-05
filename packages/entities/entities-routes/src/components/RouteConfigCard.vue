<template>
  <div class="kong-ui-entities-route-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :fetch-url="fetchUrl"
      :hide-config-card-doc="hideConfigCardDoc"
      :hide-title="hideTitle"
      @copy:success="(entity: any) => $emit('copy:success', entity)"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="handleSuccess"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #https_redirect_status_code-label-tooltip>
        <i18nT
          keypath="form.fields.https_redirect_status_code.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('form.fields.https_redirect_status_code.code1') }}</code>
          </template>
          <template #code2>
            <code>{{ t('form.fields.https_redirect_status_code.code2') }}</code>
          </template>
          <template #code3>
            <code>{{ t('form.fields.https_redirect_status_code.code3') }}</code>
          </template>
          <template #code4>
            <code>{{ t('form.fields.https_redirect_status_code.code4') }}</code>
          </template>
        </i18nT>
      </template>

      <template #regex_priority-label-tooltip>
        <i18nT
          keypath="form.fields.regex_priority.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('form.fields.regex_priority.code1') }}</code>
          </template>
          <template #code2>
            <code>{{ t('form.fields.regex_priority.code2') }}</code>
          </template>
        </i18nT>
      </template>

      <template #protocols-label-tooltip>
        <i18nT
          keypath="form.fields.protocols.tooltipConfig"
          scope="global"
        >
          <template #code1>
            <code>{{ t('form.fields.protocols.code1') }}</code>
          </template>
          <template #code2>
            <code>{{ t('form.fields.protocols.code2') }}</code>
          </template>
          <template #code3>
            <code>{{ t('form.fields.protocols.code3') }}</code>
          </template>
          <template #code4>
            <code>{{ t('form.fields.protocols.code4') }}</code>
          </template>
          <template #code5>
            <code>{{ t('form.fields.protocols.code5') }}</code>
          </template>
        </i18nT>
      </template>

      <template #headers-label-tooltip>
        <i18nT
          keypath="form.fields.headers.tooltipConfig"
          scope="global"
        >
          <template #code1>
            <code>{{ t('form.fields.headers.code1') }}</code>
          </template>
          <template #code2>
            <code>{{ t('form.fields.headers.code2') }}</code>
          </template>
          <template #code3>
            <code>{{ t('form.fields.headers.code3') }}</code>
          </template>
          <template #code4>
            <code>{{ t('form.fields.headers.code4') }}</code>
          </template>
        </i18nT>
      </template>

      <template #strip_path-label-tooltip>
        <i18nT
          keypath="form.fields.strip_path.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('form.fields.headers.code1') }}</code>
          </template>
        </i18nT>
      </template>

      <template #preserve_host-label-tooltip>
        <i18nT
          keypath="form.fields.preserve_host.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('form.fields.preserve_host.code1') }}</code>
          </template>
          <template #code2>
            <code>{{ t('form.fields.preserve_host.code2') }}</code>
          </template>
          <template #code3>
            <code>{{ t('form.fields.preserve_host.code3') }}</code>
          </template>
          <template #code4>
            <code>{{ t('form.fields.preserve_host.code4') }}</code>
          </template>
          <template #code5>
            <code>{{ t('form.fields.preserve_host.code5') }}</code>
          </template>
        </i18nT>
      </template>

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
            type: ConfigurationSchemaType.LinkInternal
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
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import {
  useAxios, EntityBaseConfigCard, ConfigurationSchemaSection, ConfigurationSchemaType, InternalLinkItem,
} from '@kong-ui-public/entities-shared'

import endpoints from '../routes-endpoints'
import composables from '../composables'
import type {
  KongManagerRouteEntityConfig, KonnectRouteEntityConfig, RouteConfigurationSchema,
} from '../types'

import '@kong-ui-public/entities-shared/dist/style.css'

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void,
  (e: 'fetch:success', data: Record<string, any>): void,
  (e: 'copy:success', data: Record<string, any>): void,
  (e: 'navigation-click', id: string, entityType: string): void,
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
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
  /** The id of the service with which the route is associated */
  serviceId: {
    type: String,
    required: false,
    default: '',
  },
  /**
   * Boolean to determine whether to display the documentation button
   */
  hideConfigCardDoc: {
    type: Boolean,
    default: false,
  },
  /**
   * External link for documentation
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
  },
})

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})
const { i18n: { t }, i18nT } = composables.useI18n()
const internalServiceId = ref('')
const serviceName = ref('')
const isServiceNameLoading = ref(false)
const fetchUrl = computed<string>(
  () => endpoints.item[props.config?.app]?.[props.serviceId ? 'forGatewayService' : 'all']
    .replace(/{serviceId}/gi, props.serviceId),
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
    url = url
      .replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
      .replace(/{serviceId}/gi, internalServiceId.value || '')
  } else if (props.config.app === 'kongManager') {
    url = url
      .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
      .replace(/{serviceId}/gi, internalServiceId.value || '')
  }

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

const configSchema = ref<RouteConfigurationSchema>({
  id: {},
  name: {
    tooltip: t('form.fields.name.tooltip'),
  },
  created_at: {},
  updated_at: {},
  service: {
    label: t('form.fields.service.label'),
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.service.tooltip'),
    order: 5,
  },
  tags: {
    tooltip: t('form.fields.tags.tooltip'),
    order: 6,
  },
  protocols: {
    section: ConfigurationSchemaSection.Basic,
    type: ConfigurationSchemaType.BadgeTag,
    order: 7,
  },
  paths: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.paths.tooltip'),
    type: ConfigurationSchemaType.BadgeTag,
    order: 8,
  },
  hosts: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.hosts.tooltipConfig'),
    type: ConfigurationSchemaType.BadgeTag,
    order: 9,
  },
  snis: {
    label: t('form.fields.snis.label'),
    tooltip: t('form.fields.snis.tooltip'),
    order: 10,
  },
  headers: {
    section: ConfigurationSchemaSection.Basic,
    order: 11,
  },
  methods: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.methods.tooltip'),
    type: ConfigurationSchemaType.BadgeMethod,
    order: 12,
  },
  sources: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.sources.tooltip'),
    type: ConfigurationSchemaType.JsonArray,
    order: 13,
  },
  destinations: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.destinations.tooltip'),
    type: ConfigurationSchemaType.JsonArray,
    order: 14,
  },
  // advanced fields
  https_redirect_status_code: {
    order: 1,
  },
  regex_priority: {
    tooltip: t('form.fields.regex_priority.tooltip'),
    order: 2,
  },
  strip_path: {
    order: 3,
  },
  preserve_host: {
    order: 4,
  },
  request_buffering: {
    tooltip: t('form.fields.request_buffering.tooltip'),
    order: 5,
  },
  response_buffering: {
    tooltip: t('form.fields.response_buffering.tooltip'),
    order: 6,
  },
  path_handling: {
    tooltip: t('form.fields.path_handling.tooltipConfig'),
    order: 7,
  },
})
</script>
