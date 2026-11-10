import { ConfigurationSchemaSection, ConfigurationSchemaType, type ConfigurationSchema } from '@kong-ui-public/entities-shared'
import type { CACertificateConfigurationSchema, CertificateConfigurationSchema } from '../types'
import type useI18n from '../composables/useI18n'

export function createCACertificateConfigCardSchema(t: ReturnType<typeof useI18n>['i18n']['t'], isKongManager: boolean) {
  return {
    id: {},
    updated_at: {},
    created_at: {},
    cert: {
      section: ConfigurationSchemaSection.Basic,
      label: t('ca-certificates.form.fields.cert.label'),
      tooltip: t('ca-certificates.form.fields.cert.tooltip'),
      order: 5,
    },
    cert_digest: {
      section: ConfigurationSchemaSection.Basic,
      label: t('ca-certificates.form.fields.cert_digest.label'),
      tooltip: t('ca-certificates.form.fields.cert_digest.tooltip'),
      order: 6,
    },
    metadata: {
      section: ConfigurationSchemaSection.Basic,
      type: ConfigurationSchemaType.Json,
      order: 7,
    },
    ...(isKongManager && {
      expiry: {
        label: t('certificates.list.table_headers.expiry'),
        section: ConfigurationSchemaSection.Basic,
        order: 1.7,
        forceShow: true,
      },
      issuer: {
        section: ConfigurationSchemaSection.Basic,
        order: 1.5,
        forceShow: true,
      },
      key_usages: {
        section: ConfigurationSchemaSection.Basic,
        forceShow: true,
      },
    }),
    tags: {
      tooltip: t('ca-certificates.form.fields.tags.tooltip'),
    },
  } satisfies CACertificateConfigurationSchema
}

export function createCertificateConfigCardSchema(t: ReturnType<typeof useI18n>['i18n']['t'], isKongManager: boolean): ConfigurationSchema {
  return {
    // basic fields
    id: {},
    cert: {
      section: ConfigurationSchemaSection.Basic,
    },
    key: {
      section: ConfigurationSchemaSection.Basic,
      type: ConfigurationSchemaType.Redacted,
    },
    metadata: {
      section: ConfigurationSchemaSection.Basic,
      type: ConfigurationSchemaType.Json,
    },
    snis: {
      section: ConfigurationSchemaSection.Basic,
      type: ConfigurationSchemaType.BadgeTag,
      label: t('certificates.list.table_headers.snis'),
    },
    updated_at: {},
    created_at: {},
    tags: {
      tooltip: t('certificates.form.fields.tags.tooltip'),
    },
    ...(isKongManager && {
      expiry: {
        section: ConfigurationSchemaSection.Basic,
        label: t('certificates.list.table_headers.expiry'),
        forceShow: true,
      },
      issuer: {
        section: ConfigurationSchemaSection.Basic,
        label: t('certificates.list.table_headers.issuer'),
        forceShow: true,
      },
      san_names: {
        section: ConfigurationSchemaSection.Basic,
        label: t('certificates.list.table_headers.san'),
        forceShow: true,
      },
      subject: {
        section: ConfigurationSchemaSection.Basic,
        label: t('certificates.list.table_headers.subject'),
        forceShow: true,
      },
      key_usages: {
        forceShow: true,
      },
    }),
    // advanced fields
    cert_alt: {
      section: ConfigurationSchemaSection.Advanced,
    },
    key_alt: {
      section: ConfigurationSchemaSection.Advanced,
      type: ConfigurationSchemaType.Redacted,
    },
  } satisfies CertificateConfigurationSchema
}
