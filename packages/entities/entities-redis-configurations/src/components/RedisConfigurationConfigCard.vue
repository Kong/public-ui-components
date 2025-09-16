<template>
  <div class="kong-ui-consumer-group-entity-config-card">
    <EntityBaseConfigCard
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Partial"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      :record-resolver="recordResolver"
      @config-format-change="console.log"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="handleData"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #type>
        <div>{{ redisTypeText }}</div>
      </template>
    </EntityBaseConfigCard>
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
import { DEFAULT_REDIS_TYPE } from '../constants'

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
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: RedisConfigurationResponse): void
}>()

const { i18n: { t } } = composables.useI18n()
const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)

const redisType = ref<RedisType>(DEFAULT_REDIS_TYPE)

const handleData = (data: any) => {
  redisType.value = getRedisType(data as RedisConfigurationResponse)
  emit('fetch:success', data)
}

const redisTypeText = computed(() => {
  const suffix = redisType.value === RedisType.HOST_PORT_CE
    ? t('form.options.type.suffix_open_source')
    : t('form.options.type.suffix_enterprise')
  let prefix = ''
  switch (redisType.value) {
    case RedisType.HOST_PORT_CE:
      prefix = t('form.options.type.host_port')
      break
    case RedisType.HOST_PORT_EE:
      prefix = t('form.options.type.host_port')
      break
    case RedisType.CLUSTER:
      prefix = t('form.options.type.cluster')
      break
    case RedisType.SENTINEL:
      prefix = t('form.options.type.sentinel')
      break
  }
  return `${prefix}${suffix}`
})

/**
 * Flatten the config object to display in the structure tab
 */
const recordResolver = (data: RedisConfigurationResponse) => {
  return {
    id: data.id,
    name: data.name,
    tags: data.tags,
    created_at: data.created_at,
    updated_at: data.updated_at,
    type: data.type,
    ...data.config,
  }
}

/**
 * Put config details into `config` object to display in the code block tab
 */
const codeBlockRecordFormatter = (record: Record<string, any>, codeFormat: string) => {
  const { id, name, created_at, updated_at, type, tags, ...config } = record
  if (codeFormat === 'terraform') {
    return {
      [type.replaceAll('-', '_')]: {
        id, name, tags, created_at, updated_at, config,
      },
    }
  }
  return {
    id, name, tags, created_at, updated_at, type, config,
  }
}

type BasicFields = {
  id: string
  name: string
  updated_at: string
  created_at: string
  type: string
  tags: string[]
}
type Fields = RedisConfigurationConfigDTO & BasicFields

/**
 * Configuration schema for all fields
 */
const schemaFieldConfigs: {
  [key in keyof Fields]: ConfigurationSchemaItem
} = {
  id: {},
  name: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.name.label'),
  },
  tags: {
    type: ConfigurationSchemaType.BadgeTag,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.tags.label'),
    tooltip: t('form.fields.tags.tooltip'),
  },
  updated_at: {},
  created_at: {},
  type: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.type.label'),
  },
  cluster_max_redirections: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    tooltip: t('form.fields.cluster_max_redirections.tooltip'),
    label: t('form.fields.cluster_max_redirections.label'),
  },
  cluster_nodes: {
    type: ConfigurationSchemaType.JsonArray,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.cluster_nodes.title'),
    tooltip: t('form.fields.cluster_nodes.tooltip'),
  },
  connect_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.connect_timeout.label'),
    tooltip: t('form.fields.connect_timeout.tooltip'),
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
    tooltip: t('form.fields.read_timeout.tooltip'),
  },
  send_timeout: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.send_timeout.label'),
    tooltip: t('form.fields.send_timeout.tooltip'),
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
    tooltip: t('form.fields.ssl_verify.tooltip'),
  },
  ssl: {
    type: ConfigurationSchemaType.Text,
    section: ConfigurationSchemaSection.Basic,
    label: t('form.fields.ssl.label'),
    tooltip: t('form.fields.ssl.tooltip'),
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

/**
 * Pick fields to display in the configuration schema
 */
const pickSchemaFields = (fields: Array<keyof Fields>): ConfigurationSchema => {
  const schema: ConfigurationSchema = {}
  const keys = Object.keys(schemaFieldConfigs) as Array<keyof Fields>
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

/**
 * Pick fields to display in the configuration card based on the Redis type
 */
const configSchema = computed<ConfigurationSchema>(() => {
  const commonFields: Array<keyof Fields> = ['id', 'name', 'tags', 'type', 'updated_at', 'created_at']
  switch (redisType.value) {
    case RedisType.HOST_PORT_CE:
      return pickSchemaFields([
        ...commonFields,
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
        ...commonFields,
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
        ...commonFields,
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
        ...commonFields,
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
