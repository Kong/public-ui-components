import { ConfigurationSchemaSection, ConfigurationSchemaType } from '@kong-ui-public/entities-shared'
import type { RouteConfigurationSchema } from '../types'
import type useI18n from '../composables/useI18n'

export function createConfigCardSchema(t: ReturnType<typeof useI18n>['i18n']['t']) {
  return {
    id: {},
    name: {
      tooltip: t('form.fields.name.tooltip'),
    },
    created_at: {},
    updated_at: {},
    service: {
      label: t('form.fields.service.label'),
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.service.tooltip'),
      order: 5,
    },
    tags: {
      tooltip: t('form.fields.tags.tooltip'),
      order: 6,
    },
    protocols: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.protocols.tooltip'),
      type: ConfigurationSchemaType.BadgeTag,
      order: 7,
    },
    paths: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.paths.tooltip'),
      type: ConfigurationSchemaType.CopyBadge,
      order: 8,
    },
    hosts: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.hosts.tooltip'),
      type: ConfigurationSchemaType.CopyBadge,
      order: 9,
    },
    snis: {
      label: t('form.fields.snis.label'),
      tooltip: t('form.fields.snis.tooltip'),
      order: 10,
    },
    headers: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.headers.tooltip'),
      order: 11,
    },
    methods: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.methods.tooltip'),
      type: ConfigurationSchemaType.BadgeMethod,
      order: 12,
    },
    sources: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.sources.tooltip'),
      type: ConfigurationSchemaType.JsonArray,
      order: 13,
    },
    destinations: {
      section: ConfigurationSchemaSection.Basic,
      tooltip: t('form.fields.destinations.tooltip'),
      type: ConfigurationSchemaType.JsonArray,
      order: 14,
    },
    // advanced fields
    https_redirect_status_code: {
      tooltip: t('form.fields.https_redirect_status_code.tooltip'),
      order: 1,
    },
    regex_priority: {
      tooltip: t('form.fields.regex_priority.tooltip'),
      order: 2,
    },
    strip_path: {
      tooltip: t('form.fields.strip_path.tooltip'),
      order: 3,
    },
    preserve_host: {
      tooltip: t('form.fields.preserve_host.tooltip'),
      order: 4,
    },
    request_buffering: {
      tooltip: t('form.fields.request_buffering.tooltip'),
      order: 5,
    },
    response_buffering: {
      tooltip: t('form.fields.response_buffering.tooltip'),
      order: 6,
    },
    path_handling: {
      tooltip: t('form.fields.path_handling.tooltip'),
      order: 7,
    },
  } satisfies RouteConfigurationSchema
}
