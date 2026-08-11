// Konnect-managed cache add-on: allowlisted keys and `ConfigurationSchema` for `EntityBaseConfigCard`
import type { ConfigurationSchema, ConfigurationSchemaItem } from '@kong-ui-public/entities-shared'
import type { AddOnRecord, AddOnValue } from '../types/cloud-gateways-add-on'
import {
  ConfigurationSchemaSection,
  ConfigurationSchemaType,
} from '@kong-ui-public/entities-shared'

export type ManagedAddOnTranslate = (key: string) => string

// Non-array object slice of `AddOnValue` (JsonArray entries must pass this)
const isPlainObject = (v: AddOnValue | undefined): v is AddOnRecord =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

// Non-empty list of plain objects
const isNonEmptyArrayOfPlainObjects = (v: AddOnValue | undefined): v is AddOnRecord[] =>
  Array.isArray(v) && v.length > 0 && v.every(isPlainObject)

// Single source of truth for row order; `pickManagedAddOnCardRecord`  will drop anything not listed here
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

export type ManagedAddOnCardKey = (typeof MANAGED_ADD_ON_CARD_KEY_ORDER)[number]

// Subset of add-on/display record keys thats pass into the card
export type ManagedAddOnCardRecord = Partial<Record<ManagedAddOnCardKey, AddOnValue | AddOnRecord | AddOnRecord[]>>

const formFieldLabel = (t: ManagedAddOnTranslate, field: string): string => {
  if (field === 'cluster_nodes' || field === 'sentinel_nodes') {
    return t(`form.fields.${field}.title`)
  }
  return t(`form.fields.${field}.label`)
}

// Default `ConfigurationSchemaItem` per key, omitting type lets `ConfigCardItem` fallback
export const getManagedAddOnSchemaFieldTemplates = (
  t: ManagedAddOnTranslate,
): Record<ManagedAddOnCardKey, ConfigurationSchemaItem> => ({
  // Empty entries- shared base card already knows how to render id, name, tags, timestamps
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
    label: formFieldLabel(t, 'cluster_nodes'),
  },
  sentinel_nodes: {
    label: formFieldLabel(t, 'sentinel_nodes'),
  },
  owner: {
    label: t('config_card.managed_add_on.fields.owner'),
  },
  state_metadata: {
    label: t('config_card.managed_add_on.fields.state_metadata'),
  },
  capacity_config: {
    label: t('config_card.managed_add_on.fields.capacity_config'),
  },
  data_plane_groups: {
    label: t('config_card.managed_add_on.fields.data_plane_groups'),
  },
  cache_state_metadata: {
    label: t('config_card.managed_add_on.fields.cache_state_metadata'),
  },
  cloud_authentication: {
    label: t('form.sections.cloud_auth.title'),
  },
  // If auth still appears as separate top-level keys, these rows stay explicit text/redacted
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

// Filter unknown API keys and fix iteration order to match `MANAGED_ADD_ON_CARD_KEY_ORDER`
export const pickManagedAddOnCardRecord = (record: AddOnRecord): ManagedAddOnCardRecord => {
  const out: ManagedAddOnCardRecord = {}
  for (const key of MANAGED_ADD_ON_CARD_KEY_ORDER) {
    if (!(key in record)) {
      continue
    }
    const value = record[key]
    if (value === undefined) {
      // Same action as omitting the row in `buildManagedAddOnCardSchema`
      continue
    }
    out[key] = value
  }
  return out
}

// One `ConfigurationSchema` row per present key- JsonArray only for non-empty cluster_nodes/ sentinel_nodes object lists
export const buildManagedAddOnCardSchema = (
  pickedRecord: ManagedAddOnCardRecord,
  t: ManagedAddOnTranslate,
): ConfigurationSchema => {
  const templates = getManagedAddOnSchemaFieldTemplates(t)
  const schema: ConfigurationSchema = {}
  let order = 0

  for (const key of MANAGED_ADD_ON_CARD_KEY_ORDER) {
    if (key === 'data_plane_groups') {
      const v = pickedRecord.data_plane_groups

      if (v === undefined) {
        continue // Advance to the next key in MANAGED_ADD_ON_CARD_KEY_ORDER
      }

      if (Array.isArray(v)) {
        schema.data_plane_groups = { // Register one field key for EntityBaseConfigCard/ ConfigCardItem
          section: ConfigurationSchemaSection.Basic, // Keep DPG with the main properties
          order: order++,
          type: ConfigurationSchemaType.JsonArray, // ConfigCardItem- block layout so value area is full width under title
          label: t('config_card.managed_add_on.fields.data_plane_groups'),
        }
      } else if (isPlainObject(v)) { // API returned a single DPG object instead of a one-element array
        schema.data_plane_groups = {
          section: ConfigurationSchemaSection.Basic,
          order: order++,
          type: ConfigurationSchemaType.Json,
          label: t('config_card.managed_add_on.fields.data_plane_group'),
        }
      }
      continue // Always skip the generic template merge for this key
    }
    // Normal fields: use template + next order number. Skip if key missing/value undefined
    if (!(key in pickedRecord)) {
      continue
    }

    const template = templates[key]
    const v = pickedRecord[key]

    if (
      (key === 'cluster_nodes' || key === 'sentinel_nodes') &&
      isNonEmptyArrayOfPlainObjects(v)) {
      // Expand each array element as its own titled block, empty or non-object arrays stay default blob behavior
      schema[key] = {
        section: ConfigurationSchemaSection.Basic,
        order: order++,
        type: ConfigurationSchemaType.JsonArray,
        label: template.label,
      }
      continue
    }

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
