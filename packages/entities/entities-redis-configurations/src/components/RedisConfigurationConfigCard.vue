<template>
  <div class="kong-ui-consumer-group-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      data-key="config"
      :entity-type="SupportedEntityType.RedisConfiguration"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="handleData"
      @loading="(val: boolean) => $emit('loading', val)"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import {
  ConfigurationSchemaSection,
  ConfigurationSchemaType,
  EntityBaseConfigCard,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import type { ConfigurationSchema, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'
import type {
  KonnectRedisConfigurationEntityConfig,
  KongManagerRedisConfigurationEntityConfig,
  RedisConfigurationResponse,
  RedisConfigurationConfigDTO,
} from '../types'
import { RedisType } from '../types'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import endpoints from '../partials-endpoints'
import { getRedisType } from '../helpers'

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectRedisConfigurationEntityConfig | KongManagerRedisConfigurationEntityConfig>,
    required: true,
    validator: (config: KonnectRedisConfigurationEntityConfig | KongManagerRedisConfigurationEntityConfig): boolean => {
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
    default: true,
  },
})

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void,
  (e: 'fetch:success', data: Record<string, any>): void,
}>()

const { i18n: { t } } = composables.useI18n()
const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)

const redisType = ref(RedisType.HOST_PORT_CE)

const handleData = (data: any) => {
  redisType.value = getRedisType(data as RedisConfigurationResponse)
  emit('fetch:success', data)
}

const schemaFieldConfigs: {
  [key in keyof RedisConfigurationConfigDTO]: ConfigurationSchemaItem
} = {
  cluster_max_redirections: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.cluster_max_redirections.tooltip'),
    label: t('form.fields.cluster_max_redirections.label'),
  },
  cluster_nodes: {
    type: ConfigurationSchemaType.JsonArray,
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.cluster_nodes.tooltip'),
    label: t('form.fields.cluster_nodes.title'),
  },
  connect_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.connect_timeout.label'),
  },
  connection_is_proxied: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.connection_is_proxied.label'),
    tooltip: t('form.fields.connection_is_proxied.tooltip'),
  },
  database: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.database.label'),
    tooltip: t('form.fields.database.tooltip'),
  },
  host: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.host.label'),
    tooltip: t('form.fields.host.tooltip'),
  },
  keepalive_backlog: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.keepalive_backlog.label'),
    tooltip: t('form.fields.keepalive_backlog.tooltip'),
  },
  keepalive_pool_size: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.keepalive_pool_size.label'),
    tooltip: t('form.fields.keepalive_pool_size.tooltip'),
  },
  password: {
    type: ConfigurationSchemaType.Redacted,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.password.label'),
    tooltip: t('form.fields.password.tooltip'),
  },
  port: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.port.label'),
    tooltip: t('form.fields.port.tooltip'),
  },
  read_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.read_timeout.label'),
  },
  send_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.send_timeout.label'),
  },
  sentinel_master: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_master.label'),
    tooltip: t('form.fields.sentinel_master.tooltip'),
  },
  sentinel_nodes: {
    type: ConfigurationSchemaType.JsonArray,
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.sentinel_nodes.tooltip'),
  },
  sentinel_password: {
    type: ConfigurationSchemaType.Redacted,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_password.label'),
    tooltip: t('form.fields.sentinel_password.tooltip'),
  },
  sentinel_role: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_role.label'),
    tooltip: t('form.fields.sentinel_role.tooltip'),
  },
  sentinel_username: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.sentinel_username.label'),
    tooltip: t('form.fields.sentinel_username.tooltip'),
  },
  server_name: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.server_name.label'),
    tooltip: t('form.fields.server_name.tooltip'),
  },
  ssl_verify: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.ssl_verify.label'),
  },
  ssl: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.ssl.label'),
  },
  timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.timeout.label'),
    tooltip: t('form.fields.timeout.tooltip'),
  },
  username: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.username.label'),
    tooltip: t('form.fields.username.tooltip'),
  },
}

const pickSchemaFields = (fields: Array<keyof RedisConfigurationConfigDTO>): ConfigurationSchema => {
  const schema: ConfigurationSchema = {}
  const keys = Object.keys(schemaFieldConfigs) as Array<keyof RedisConfigurationConfigDTO>
  for (const field of keys) {
    if (fields.includes(field)) {
      schema[field] = {
        ...schemaFieldConfigs[field],
        order: fields.indexOf(field) + 1,
      }
    } else {
      schema[field] = {
        ...schemaFieldConfigs[field],
        hidden: true,
      }
    }
  }
  return schema
}

const configSchema = computed<ConfigurationSchema>(() => {
  switch (redisType.value) {
    case RedisType.HOST_PORT_CE:
      return pickSchemaFields([
        'host',
        'port',
        'timeout',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
      ])
    case RedisType.HOST_PORT_EE:
      return pickSchemaFields([
        'host',
        'port',
        'connection_is_proxied',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
        'keepalive_backlog',
        'keepalive_pool_size',
        'read_timeout',
        'send_timeout',
        'connect_timeout',
      ])
    case RedisType.CLUSTER:
      return pickSchemaFields([
        'cluster_nodes',
        'cluster_max_redirections',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
        'keepalive_backlog',
        'keepalive_pool_size',
        'read_timeout',
        'send_timeout',
        'connect_timeout',
      ])
    case RedisType.SENTINEL:
      return pickSchemaFields([
        'sentinel_master',
        'sentinel_role',
        'sentinel_nodes',
        'sentinel_username',
        'sentinel_password',
        'database',
        'username',
        'password',
        'ssl',
        'ssl_verify',
        'server_name',
        'keepalive_backlog',
        'keepalive_pool_size',
        'read_timeout',
        'send_timeout',
        'connect_timeout',
      ])
    default:
      throw new Error('Invalid Redis type')
  }
})
</script>
