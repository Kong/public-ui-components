import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { EntityType } from './plugin'
import type { ApplicationRegistrationSchema } from '../types/plugins/application-registration-schema'
import type { StatsDSchema } from '../types/plugins/stats-d'
import type { MockingSchema } from '../types/plugins/mocking'
import type { DatadogSchema } from '../types/plugins/datadog-schema'
import type { StatsDAdvancedSchema } from '../types/plugins/stats-d-advanced'
import type { KafkaSchema } from '../types/plugins/kafka-schema'
import type { UpstreamTlsSchema } from '../types/plugins/upstream-tls'

export interface BasePluginFormConfig {
  /** A function that returns the route for creating a plugin */
  getCreateRoute: (id: string) => RouteLocationRaw
  /** Current entity type and id for plugins for specific entity */
  entityType?: EntityType
  entityId?: string
}

/** Konnect Plugin form config */
export interface KonnectPluginFormConfig extends BasePluginFormConfig, KonnectBaseFormConfig {
  /** Route for creating a custom plugin */
  createCustomRoute?: RouteLocationRaw
  /** A function that returns the route for editing a custom plugin */
  getCustomEditRoute?: (id: string) => RouteLocationRaw
}

/** Kong Manager Plugin form config */
export interface KongManagerPluginFormConfig extends BasePluginFormConfig, KongManagerBaseFormConfig {}

export interface PluginFormFields {
  name: string
  tags: string
  entity_id: string
}

export interface PluginFormState {
  /** Form fields */
  fields: PluginFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}

export interface Tags {
  label: string
  name: string
  type: string
  inputType: string
  valueType: string
  valueArrayType: string
  placeholder: string
  help: string
  hint: string
}

export interface AppRegFormSchema {
  enabled: {
    type: string
    model: string
    label: string
    textOn: string
    textOff: string
    inputType: string
    styleClasses: string
    default: boolean
  },
  name: {
    default: string
    type: string
    inputType: string
    styleClasses: string
  }
  'service-id': {
    type: string
    label: string,
    styleClasses: string
    description: string
    model: string,
    entity: string
    placeholder: string,
    inputValues: {
      fields: string[]
    },
    help: string
  },
  tags: Tags
}

export interface Item {
  inputAttributes?: any,
  newElementButtonLabel?: string
}

interface ArrayItem {
  type: string,
  itemContainerComponent: string,
  fieldClasses: string,
  fieldItemsClasses: string,
  newElementButtonLabelClasses: string,
  inputAttributes: {
    class: string,
    style: {
      minWidth: string,
    },
    [key: string]: any,
  },
  removeElementButtonLabel: string,
  styleClasses: string,
  inputType: string,
  valueType: string,
  valueArrayType: string,
}

export type ReturnArrayItem = ArrayItem & Item

interface Field {
  model?: string
  label: string
  type: string
  values?: string[]
  id?: string
  default?: string,
  placeholder?: string,
  hint?: string,
  inputType?: 'text' | 'number'
}

export interface CustomSchemas {
  'application-registration': ApplicationRegistrationSchema,
  datadog: DatadogSchema,
  'upstream-tls': UpstreamTlsSchema,
  'kafka-upstream': KafkaSchema,
  'kafka-log': KafkaSchema,
  statsd: StatsDSchema,
  'statsd-advanced': StatsDAdvancedSchema,
  mocking: MockingSchema,
  'rate-limiting': {
    useKonnectSchema: boolean,
    'config-policy': Field,
    'config-strategy': Field,
    'config-consumer_groups': Field,
  },
  'rate-limiting-advanced': {
    useKonnectSchema: boolean,
    'config-policy': Field,
    'config-strategy': Field,
    'config-consumer_groups': Field,
  },
  'route-by-header': {
    configurationDisabled: boolean,
  },
  'graphql-rate-limiting-advanced': {
    useKonnectSchema: boolean,
    'config-strategy': Field,
  },
  'response-ratelimiting': {
    useKonnectSchema: boolean,
    'config-policy': Field,
    'config-strategy': Field,
    'config-consumer_groups': Field,
  },
  'pre-function': any,
  'post-function': any,
  'request-transformer-advanced': any,
  'request-validator': any,
  zipkin: any
}
