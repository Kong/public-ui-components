import { ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { KeyConfigurationSchema } from '../types'
import type useI18n from '../composables/useI18n'

export function createConfigCardSchema(t: ReturnType<typeof useI18n>['i18n']['t']) {
  return {
    id: {},
    name: {
      tooltip: t('keys.form.fields.name.tooltip'),
    },
    last_updated: {},
    created: {},
    set: {
      label: t('keys.form.fields.set.label'),
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('keys.form.fields.set.tooltip'),
      order: 5,
    },
    kid: {
      label: t('keys.form.fields.kid.label'),
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('keys.form.fields.kid.tooltip'),
    },
    tags: {
      tooltip: t('keys.form.fields.tags.tooltip'),
    },
    // advanced fields
    jwk: {
      label: t('keys.form.fields.jwk.label'),
      type: ConfigurationSchemaType.Json,
    },
    pem: {
      section: ConfigurationSchemaSection.Advanced,
      label: t('keys.form.fields.key_format.options.pem'),
      type: ConfigurationSchemaType.Json,
    },
  } satisfies KeyConfigurationSchema
}
