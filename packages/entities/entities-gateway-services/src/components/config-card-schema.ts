import { ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { GatewayServiceConfigurationSchema } from '../types'
import type useI18n from '../composables/useI18n'

export function createConfigCardSchema(t: ReturnType<typeof useI18n>['i18n']['t']) {
  return {
    id: {},
    name: {
      tooltip: t('gateway_services.form.fields.name.tooltip'),
    },
    enabled: {},
    updated_at: {},
    created_at: {},
    protocol: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('gateway_services.form.fields.protocol.tooltip'),
    },
    host: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('gateway_services.form.fields.host.tooltip'),
    },
    path: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('gateway_services.form.fields.path.tooltip'),
    },
    port: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('gateway_services.form.fields.port.tooltip'),
    },
    tags: {
      tooltip: t('gateway_services.form.fields.tags.tooltip'),
    },
    // advanced fields
    retries: {
      order: 1,
      tooltip: t('gateway_services.form.fields.retries.tooltip'),
    },
    connect_timeout: {
      order: 2,
      tooltip: t('gateway_services.form.fields.connect_timeout.tooltip'),
    },
    write_timeout: {
      order: 3,
      tooltip: t('gateway_services.form.fields.write_timeout.tooltip'),
    },
    read_timeout: {
      order: 4,
      tooltip: t('gateway_services.form.fields.read_timeout.tooltip'),
    },
    client_certificate: {
      order: 5,
      tooltip: t('gateway_services.form.fields.client_certificate.tooltip'),
    },
    ca_certificates: {
      type: ConfigurationSchemaType.BadgeTag,
      label: t('gateway_services.form.fields.ca_certificates.label'),
      order: 6,
    },
    tls_verify: {
      label: t('gateway_services.form.fields.tls_verify_enabled.label'),
    },
    tls_verify_depth: {
      hidden: true,
    },
  } satisfies GatewayServiceConfigurationSchema
}
