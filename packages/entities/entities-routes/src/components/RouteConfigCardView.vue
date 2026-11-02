<template>
  <div class="kong-ui-entities-route-entity-config-card">
    <EntityConfigCardView
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Route"
      :hide-title="hideTitle"
      :record="displayRecord"
      :request-url="requestUrl"
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
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import { ConfigurationSchemaSection, ConfigurationSchemaType, EntityConfigCardView, InternalLinkItem, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import type { RouteConfigurationSchema } from '../types'

import '@kong-ui-public/entities-shared/dist/style.css'

defineEmits<{
  (e: 'navigation-click', id: string, entityType: string): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  serviceName: { type: String, default: undefined },
  serviceNameLoading: { type: Boolean, default: false },
  record: { type: Object as PropType<Record<string, any>>, required: true },
  requestUrl: { type: String, default: '' },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
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

const { i18n: { t } } = composables.useI18n()
const internalServiceId = computed(() => props.serviceId || props.record.service?.id || '')
const serviceName = computed(() => props.serviceName ?? internalServiceId.value)
const isServiceNameLoading = computed(() => props.serviceNameLoading)

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
    tooltip: t('form.fields.protocols.tooltip'),
    type: ConfigurationSchemaType.BadgeTag,
    order: 7,
  },
  paths: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.paths.tooltip'),
    type: ConfigurationSchemaType.CopyBadge,
    order: 8,
  },
  hosts: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.hosts.tooltip'),
    type: ConfigurationSchemaType.CopyBadge,
    order: 9,
  },
  snis: {
    label: t('form.fields.snis.label'),
    tooltip: t('form.fields.snis.tooltip'),
    order: 10,
  },
  headers: {
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.headers.tooltip'),
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
    tooltip: t('form.fields.https_redirect_status_code.tooltip'),
    order: 1,
  },
  regex_priority: {
    tooltip: t('form.fields.regex_priority.tooltip'),
    order: 2,
  },
  strip_path: {
    tooltip: t('form.fields.strip_path.tooltip'),
    order: 3,
  },
  preserve_host: {
    tooltip: t('form.fields.preserve_host.tooltip'),
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
    tooltip: t('form.fields.path_handling.tooltip'),
    order: 7,
  },
})
const displayRecord = computed(() => props.record)
</script>
