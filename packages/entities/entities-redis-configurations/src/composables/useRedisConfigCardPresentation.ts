import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import type { ConfigurationSchema, ConfigurationSchemaItem, ConfigCardCodeFormat } from '@kong-ui-public/entities-shared'
import { ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { RedisConfigurationConfigDTO, RedisConfigurationResponse } from '../types'
import { RedisType } from '../types'
import type { AddOnRecord, AddOnValue, CloudGatewaysAddOnResponse } from '../types/cloud-gateways-add-on'
import { getRedisType } from '../helpers'
import { addOnApiResponseToDisplayRecord } from '../helpers/managed-cache-add-on'
import { cloudAuthenticationObjectForDisplay } from '../helpers/managed-cache-add-on-display'
import { pickManagedAddOnCardRecord, buildManagedAddOnCardSchema } from '../helpers/managed-add-on-config-schema'
import { addOnToTerraformArgs } from '../helpers/managed-cache-add-on-tab-payloads'
import composables from '../composables'

// Flatten the config object to display in the structure tab
export function toRedisPartialConfigCardRecord(row: RedisConfigurationResponse, cloudAuthAvailable: boolean | undefined): AddOnRecord {
  const partialConfig = row.config ?? {}
  const displayRecord: AddOnRecord = {
    id: row.id,
    name: row.name,
    tags: row.tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
    type: row.type,
    ...partialConfig,
  }
  if (cloudAuthAvailable) {
    const raw = partialConfig.cloud_authentication
    const cloudAuth = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : undefined
    const displayAuth = cloudAuthenticationObjectForDisplay((cloudAuth ?? {}) as AddOnRecord, true)

    // The flat display drops nested objects, but OAuth needs its own JSON block.
    if (displayAuth && cloudAuth?.oauth) {
      displayAuth.oauth = cloudAuth.oauth as AddOnValue
    }
    displayRecord.cloud_authentication = displayAuth
  }
  return displayRecord
}

// Restore the nested API config for code formats; Terraform uses the Redis type as its key.
export function formatPartialRecord(record: AddOnRecord, codeFormat: ConfigCardCodeFormat): AddOnRecord {
  if (!record || Object.keys(record).length === 0) {
    return {}
  }

  const { id, name, created_at, updated_at, type, tags, ...config } = record
  const metadata = { id, name, tags, created_at, updated_at }
  if (codeFormat === 'terraform') {
    const typeKey = typeof type === 'string' ? type.replaceAll('-', '_') : 'partial'
    return { [typeKey]: { ...metadata, config } }
  }
  return { ...metadata, type, config }
}

export function useRedisPartialConfigCardPresentation(
  redisType: Readonly<Ref<RedisType>>,
  t: ReturnType<typeof composables.useI18n>['i18n']['t'],
) {
  // Labels used in legacy detail mode
  const redisTypeText = computed(() => {
    const suffix = redisType.value === RedisType.HOST_PORT_CE
      ? t('form.options.type.suffix_open_source')
      : t('form.options.type.suffix_enterprise')
    let prefix = ''
    switch (redisType.value) {
      case RedisType.HOST_PORT_CE:
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

  type BasicFields = {
    id: string
    name: string
    updated_at: string | number
    created_at: string | number
    type: string
    tags: string[]
  }
  type Fields = RedisConfigurationConfigDTO & BasicFields

  // Configuration schema for all supported partial fields.
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
    cloud_authentication: {
      type: ConfigurationSchemaType.Json,
      section: ConfigurationSchemaSection.Basic,
      label: t('form.sections.cloud_auth.title'),
    },
  }

  // Keep omitted fields hidden while retaining their masking configuration.
  const pickSchemaFields = (fields: Array<keyof Fields>): ConfigurationSchema => {
    const schema: ConfigurationSchema = {}
    const keys = Object.keys(schemaFieldConfigs) as Array<keyof Fields>
    for (const field of keys) {
      const index = fields.indexOf(field)
      schema[field] = {
        ...schemaFieldConfigs[field],
        ...(index === -1 ? { hidden: true } : { order: index + 1 }),
      }
    }
    return schema
  }

  // Partial fields depend on the Redis topology.
  const partialSchema = computed<ConfigurationSchema>(() => {
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
          'cloud_authentication',
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
          'cloud_authentication',
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
          'cloud_authentication',
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
  return { redisTypeText, partialSchema }
}

export default function useRedisConfigCardPresentation(
  record: MaybeRefOrGetter<Record<string, any>>,
  cloudAuthAvailable: MaybeRefOrGetter<boolean>,
) {
  const { i18n: { t } } = composables.useI18n()
  const redisType = computed(() => getRedisType(toValue(record) as RedisConfigurationResponse))
  const { redisTypeText, partialSchema } = useRedisPartialConfigCardPresentation(redisType, t)
  const partialRecord = computed(() => toRedisPartialConfigCardRecord(toValue(record) as RedisConfigurationResponse, toValue(cloudAuthAvailable)))
  const managedRecord = computed(() => pickManagedAddOnCardRecord(addOnApiResponseToDisplayRecord(toValue(record), {
    cloudAuthAvailable: toValue(cloudAuthAvailable),
  })))

  // ConfigCardDisplay supplies an independent clone before this per-format conversion.
  const formatManagedRecord = (
    record: Record<string, any>,
    codeFormat: ConfigCardCodeFormat,
  ): Record<string, any> => {
    const addOn = record as CloudGatewaysAddOnResponse
    return codeFormat === 'terraform' ? addOnToTerraformArgs(addOn) : record
  }

  const managedSchema = computed(() => buildManagedAddOnCardSchema(managedRecord.value, path => t(path as never)))
  return { redisTypeText, partialRecord, partialSchema, formatPartialRecord, managedRecord, managedSchema, formatManagedRecord }
}
