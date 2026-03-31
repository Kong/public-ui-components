/**
 * Konnect-managed-cache add-on config card: allowlisted keys, label/type templates, and schema build for EntityBaseConfigCard.
 * DPG uses Json vs JsonArray so rows indent like `capacity_config`.
 */
import type { ConfigurationSchema, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'
import type { AddOnRecord, AddOnValue } from '../types/cloud-gateways-add-on'
import {
  ConfigurationSchemaSection,
  ConfigurationSchemaType,
} from '@kong-ui-public/entities-shared'

export type ManagedAddOnTranslate = (key: string) => string

const isPlainObject = (v: AddOnValue | undefined): v is AddOnRecord =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * Keys the managed card may show, in order (same idea as self-managed partial: flat `config` fields first, then Json blobs).
 * Unknown API keys are dropped in `pickManagedAddOnCardRecord`.
 */
export const MANAGED_ADD_ON_CARD_KEY_ORDER = [
  'id',
  'name',
  'type',
  'tags',
  'state',
  'entity_version',
  'created_at',
  'updated_at',
  'kind',
  'host',
  'port',
  'timeout',
  'database',
  'username',
  'password',
  'ssl',
  'ssl_verify',
  'server_name',
  'connection_is_proxied',
  'keepalive_backlog',
  'keepalive_pool_size',
  'read_timeout',
  'send_timeout',
  'connect_timeout',
  'cluster_max_redirections',
  'sentinel_master',
  'sentinel_role',
  'sentinel_username',
  'sentinel_password',
  'cluster_nodes',
  'sentinel_nodes',
  'owner',
  'state_metadata',
  'capacity_config',
  'data_plane_groups',
  'cache_state_metadata',
  'cloud_authentication',
  'cloud_authentication_auth_provider',
  'cloud_authentication_aws_cache_name',
  'cloud_authentication_aws_region',
  'cloud_authentication_aws_is_serverless',
  'cloud_authentication_aws_access_key_id',
  'cloud_authentication_aws_secret_access_key',
  'cloud_authentication_aws_assume_role_arn',
  'cloud_authentication_aws_role_session_name',
  'cloud_authentication_gcp_service_account_json',
  'cloud_authentication_azure_client_id',
  'cloud_authentication_azure_client_secret',
  'cloud_authentication_azure_tenant_id',
] as const

// These are the only keys this card is allowed to render
export type ManagedAddOnCardKey = (typeof MANAGED_ADD_ON_CARD_KEY_ORDER)[number]
// Shaped record can include any subset of those keys
export type ManagedAddOnCardRecord = Partial<Record<ManagedAddOnCardKey, AddOnValue | AddOnRecord | AddOnRecord[]>>

// Array fields use `.title`; regular fields use `.label`
const formFieldLabel = (t: ManagedAddOnTranslate, field: string): string => {
  if (field === 'cluster_nodes' || field === 'sentinel_nodes') {
    return t(`form.fields.${field}.title`)
  }
  return t(`form.fields.${field}.label`)
}

// Per-field label/type templates. Base card fills defaults for id/name/tags/dates
export const getManagedAddOnSchemaFieldTemplates = (
  t: ManagedAddOnTranslate,
): Record<ManagedAddOnCardKey, ConfigurationSchemaItem> => ({
  id: {},
  name: {},
  tags: {},
  created_at: {},
  updated_at: {},
  type: {
    type: ConfigurationSchemaType.Text,
    label: t('config_card.managed_add_on.fields.type'),
  },
  state: {
    type: ConfigurationSchemaType.Text,
    label: t('config_card.managed_add_on.fields.state'),
  },
  entity_version: {
    type: ConfigurationSchemaType.Text,
    label: t('config_card.managed_add_on.fields.entity_version'),
  },
  kind: {
    type: ConfigurationSchemaType.Text,
    label: t('config_card.managed_add_on.fields.kind'),
  },
  host: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'host'),
  },
  port: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'port'),
  },
  timeout: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'timeout'),
  },
  database: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'database'),
  },
  username: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'username'),
  },
  password: {
    type: ConfigurationSchemaType.Redacted,
    label: formFieldLabel(t, 'password'),
  },
  ssl: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'ssl'),
  },
  ssl_verify: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'ssl_verify'),
  },
  server_name: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'server_name'),
  },
  connection_is_proxied: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'connection_is_proxied'),
  },
  keepalive_backlog: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'keepalive_backlog'),
  },
  keepalive_pool_size: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'keepalive_pool_size'),
  },
  read_timeout: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'read_timeout'),
  },
  send_timeout: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'send_timeout'),
  },
  connect_timeout: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'connect_timeout'),
  },
  cluster_max_redirections: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'cluster_max_redirections'),
  },
  sentinel_master: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'sentinel_master'),
  },
  sentinel_role: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'sentinel_role'),
  },
  sentinel_username: {
    type: ConfigurationSchemaType.Text,
    label: formFieldLabel(t, 'sentinel_username'),
  },
  sentinel_password: {
    type: ConfigurationSchemaType.Redacted,
    label: formFieldLabel(t, 'sentinel_password'),
  },
  cluster_nodes: {
    type: ConfigurationSchemaType.JsonArray,
    label: formFieldLabel(t, 'cluster_nodes'),
  },
  sentinel_nodes: {
    type: ConfigurationSchemaType.JsonArray,
    label: formFieldLabel(t, 'sentinel_nodes'),
  },
  owner: {
    type: ConfigurationSchemaType.Json,
    label: t('config_card.managed_add_on.fields.owner'),
  },
  state_metadata: {
    type: ConfigurationSchemaType.Json,
    label: t('config_card.managed_add_on.fields.state_metadata'),
  },
  capacity_config: {
    type: ConfigurationSchemaType.Json,
    label: t('config_card.managed_add_on.fields.capacity_config'),
  },
  // Placeholder type; we choose Json vs JsonArray from the actual payload later.
  data_plane_groups: {
    type: ConfigurationSchemaType.Json,
    label: t('config_card.managed_add_on.fields.data_plane_groups'),
  },
  cache_state_metadata: {
    type: ConfigurationSchemaType.Json,
    label: t('config_card.managed_add_on.fields.cache_state_metadata'),
  },
  cloud_authentication: {
    type: ConfigurationSchemaType.Json,
    label: t('form.sections.cloud_auth.title'),
  },
  cloud_authentication_auth_provider: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.auth_provider.label'),
  },
  cloud_authentication_aws_cache_name: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.aws_cache_name.label'),
  },
  cloud_authentication_aws_region: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.aws_region.label'),
  },
  cloud_authentication_aws_is_serverless: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.aws_is_serverless.label'),
  },
  cloud_authentication_aws_access_key_id: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.aws_access_key_id.label'),
  },
  cloud_authentication_aws_secret_access_key: {
    type: ConfigurationSchemaType.Redacted,
    label: t('form.fields.cloud_authentication.aws_secret_access_key.label'),
  },
  cloud_authentication_aws_assume_role_arn: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.aws_assume_role_arn.label'),
  },
  cloud_authentication_aws_role_session_name: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.aws_role_session_name.label'),
  },
  cloud_authentication_gcp_service_account_json: {
    type: ConfigurationSchemaType.Redacted,
    label: t('form.fields.cloud_authentication.gcp_service_account_json.label'),
  },
  cloud_authentication_azure_client_id: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.azure_client_id.label'),
  },
  cloud_authentication_azure_client_secret: {
    type: ConfigurationSchemaType.Redacted,
    label: t('form.fields.cloud_authentication.azure_client_secret.label'),
  },
  cloud_authentication_azure_tenant_id: {
    type: ConfigurationSchemaType.Text,
    label: t('form.fields.cloud_authentication.azure_tenant_id.label'),
  },
})

// Keep only keys the card knows how to show
export const pickManagedAddOnCardRecord = (record: AddOnRecord): ManagedAddOnCardRecord => {
  const out: ManagedAddOnCardRecord = {}
  // Loop in a fixed order so the output is predictable
  for (const key of MANAGED_ADD_ON_CARD_KEY_ORDER) {
    if (!(key in record)) {
      continue
    }
    const value = record[key]
    if (value === undefined) {
      continue
    }
    out[key] = value
  }
  return out
}

// Build schema from the shaped record
export const buildManagedAddOnCardSchema = (
  pickedRecord: ManagedAddOnCardRecord,
  t: ManagedAddOnTranslate,
): ConfigurationSchema => {
  const templates = getManagedAddOnSchemaFieldTemplates(t)
  const schema: ConfigurationSchema = {}
  // `order` controls row position in config card
  let order = 0

  // Keep display order stable by looping allowlist, not record keys. Skip keys not in record or with undefined value
  for (const key of MANAGED_ADD_ON_CARD_KEY_ORDER) {
    // `data_plane_groups` can be 1 object or a list, so choose type at runtime
    if (key === 'data_plane_groups') {
      const v = pickedRecord.data_plane_groups

      if (v === undefined) {
        continue
      }

      if (Array.isArray(v)) {
        // Multiple groups- render as JsonArray
        schema.data_plane_groups = {
          section: ConfigurationSchemaSection.Basic,
          order: order++,
          type: ConfigurationSchemaType.JsonArray,
          label: t('config_card.managed_add_on.fields.data_plane_groups'),
        }
      } else if (isPlainObject(v)) {
        // Single group- render as Json
        schema.data_plane_groups = {
          section: ConfigurationSchemaSection.Basic,
          order: order++,
          type: ConfigurationSchemaType.Json,
          label: t('config_card.managed_add_on.fields.data_plane_group'),
        }
      }
      continue
    }
    // Normal fields: use template + next order number. Skip if key missing/value undefined
    if (!(key in pickedRecord)) {
      continue
    }

    const template = templates[key]
    schema[key] = {
      section: ConfigurationSchemaSection.Basic,
      order: order++,
      ...template,
    }
  }

  // Fallback: when record has cloud_authentication, force Json renderer + label.
  // This prevents fallback object rendering as a raw code block
  if (pickedRecord.cloud_authentication !== undefined && !schema.cloud_authentication) {
    schema.cloud_authentication = {
      section: ConfigurationSchemaSection.Basic,
      order: order++,
      ...templates.cloud_authentication,
    }
  }

  return schema
}
