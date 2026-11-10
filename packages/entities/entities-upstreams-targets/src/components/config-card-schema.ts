import { ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { UpstreamsConfigurationSchema } from '../types'
import type useI18n from '../composables/useI18n'

export function createConfigCardSchema(t: ReturnType<typeof useI18n>['i18n']['t']) {
  return {
    id: {},
    name: {},
    created_at: {},
    updated_at: {},
    algorithm: {
      order: 5,
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('upstreams.form.fields.algorithm.tooltip'),
    },
    slots: {
      order: 6,
      section: ConfigurationSchemaSection.Basic,
    },
    hash_on: {
      order: 7,
      section: ConfigurationSchemaSection.Basic,
    },
    hash_on_header: {
      order: 8,
      section: ConfigurationSchemaSection.Basic,
    },
    hash_on_uri_capture: {
      order: 9,
      section: ConfigurationSchemaSection.Basic,
    },
    hash_on_query_arg: {
      order: 10,
      section: ConfigurationSchemaSection.Basic,
      label: `${t('upstreams.form.fields.hash_on.label')} ${t('upstreams.form.hash_labels.query_argument')}`,
    },
    hash_on_cookie: {
      order: 11,
      section: ConfigurationSchemaSection.Basic,
    },
    hash_on_cookie_path: {
      order: 12,
      section: ConfigurationSchemaSection.Basic,
    },
    healthchecks: {
      order: 13,
      section: ConfigurationSchemaSection.Basic,
      // TODO: change to JsonArray
      type: ConfigurationSchemaType.Json,
    },
    tags: {
      order: 14,
      tooltip: t('upstreams.form.hash_tooltips.tags'),
    },
    // Advanced section
    hash_fallback: {
      order: 1,
    },
    hash_fallback_header: {
      order: 2,
    },
    hash_fallback_query_arg: {
      order: 3,
      label: `${t('upstreams.form.fields.hash_fallback.label')} ${t('upstreams.form.hash_labels.query_argument')}`,
    },
    hash_fallback_uri_capture: {
      order: 4,
    },
    host_header: {
      order: 5,
    },
    use_srv_name: {
      order: 6,
    },
    client_certificate: {
      order: 7,
      tooltip: t('upstreams.form.hash_tooltips.client_certificate'),
    },
  } satisfies UpstreamsConfigurationSchema
}
