import { ConfigurationSchemaSection } from '@kong-ui-public/entities-shared'
import type { ConsumerConfigurationSchema } from '../types'
import type useI18n from '../composables/useI18n'

export function createConfigCardSchema(t: ReturnType<typeof useI18n>['i18n']['t']) {
  return {
    id: {},
    username: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('consumers.fields.username.tooltip'),
      order: 1,
    },
    custom_id: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('consumers.fields.custom_id.tooltip'),
      label: t('consumers.fields.custom_id.label'),
      order: 2,
    },
    updated_at: {},
    created_at: {},
    tags: {
      tooltip: t('consumers.fields.tags.tooltip'),
    },
    username_lower: {
      hidden: true,
    },
    type: {
      hidden: true,
    },
  } satisfies ConsumerConfigurationSchema
}
