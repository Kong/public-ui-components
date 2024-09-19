import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { EntityType } from './plugin'
import type { CommonSchemaFields } from './plugins/shared'
import type { ApplicationRegistrationSchema } from './plugins/application-registration-schema'
import type { StatsDSchema } from './plugins/stats-d'
import type { MockingSchema } from './plugins/mocking'
import type { DatadogSchema } from './plugins/datadog-schema'
import type { StatsDAdvancedSchema } from './plugins/stats-d-advanced'
import type { UpstreamTlsSchema } from './plugins/upstream-tls'
import type { RateLimitingSchema } from './plugins/rate-limiting'
import type { RouteByHeaderSchema } from './plugins/route-by-header'
import type { AIPromptDecoratorSchema } from './plugins/ai-prompt-decorator'
import type { AIPromptTemplateSchema } from './plugins/ai-prompt-template'
import type { AIRateLimitingAdvancedSchema } from './plugins/ai-rate-limiting-advanced'
import type { VaultAuthSchema } from './plugins/vault-auth'
import type { GraphQLRateLimitingAdvancedSchema } from './plugins/graphql-rate-limiting-advanced'
import type { SAMLSchema } from './plugins/saml'
import type { OasValidationSchema } from './plugins/oas-validation'
import type { UpstreamOauthSchema } from './plugins/upstream-oauth'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface BasePluginSelectConfig {
  /** A function that returns the route for creating a plugin */
  getCreateRoute: (id: string) => RouteLocationRaw
  /** Current entity type and id for plugins for specific entity */
  entityType?: EntityType
  entityId?: string
}

export interface BasePluginFormConfig {
  /** Current entity type and id for plugins for specific entity */
  entityType?: EntityType
  entityId?: string
  /** Whether to hide the consumer group scope field. For Kong Manager OSS, this is true */
  disableConsumerGroupScope?: boolean
  /** Whether to use the new OpenTelemetry schema introduced in https://github.com/Kong/kong-ee/pull/9399/files#diff-8d295aaa72ee8a0a18dcb8010b0a73ac36a92e1e825b3202b1d1736d07d7e514 */
  isNewOtelSchema?: boolean
}

export interface KongManagerPluginSelectConfig extends BasePluginSelectConfig, KongManagerBaseFormConfig {}

/** Konnect Plugin form config */
export interface KonnectPluginSelectConfig extends BasePluginSelectConfig, KonnectBaseFormConfig {
  /** Route for creating a custom plugin */
  createCustomRoute?: RouteLocationRaw
  /** A function that returns the route for editing a custom plugin */
  getCustomEditRoute?: (id: string) => RouteLocationRaw
}

export interface KonnectPluginFormConfig extends BasePluginFormConfig, KonnectBaseFormConfig {}

/** Kong Manager Plugin form config */
export interface KongManagerPluginFormConfig extends BasePluginFormConfig, KongManagerBaseFormConfig {}

export interface PluginFormFields {
  enabled: boolean
  name?: string
  instance_name?: string
  protocols: string[]
  tags: string[]
  [key: string]: any
}

export interface PluginFormState {
  /** Form fields */
  fields: PluginFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}

export type PluginFieldType = 'switch' | 'input' | 'foreign' | 'selectionGroup' | 'tag' | 'multiselect' | 'select'

export interface PluginTags {
  label: string
  name: string
  type: 'switch' | 'input' | 'foreign' | 'selectionGroup' | 'tag'
  inputType: string
  valueType: string
  valueArrayType: string
  placeholder: string
  help: string
  hint: string
}

export interface DefaultPluginsFormSchema {
  type: PluginFieldType
  default?: boolean | string[] | string
  model?: 'enabled' | 'disabled'
  label?: string
  textOn?: string
  textOff?: string
  styleClasses?: string
  inputType?: 'hidden' | 'text'
  // Will be fixed in KHCP-6469
  fields? : any
  help?: string
  tags?: PluginTags
  values?: Array<Record<string, string | number | boolean>>
  placeholder?: string
  required?: boolean
  /** Whether the field is pinned before the Plugin Configuration. FE only */
  pinned?: boolean
  // Will be fixed in KHCP-6469
  getColumnFields?: (schema: unknown) => object
}

export type PartiallyRequired<T, K extends keyof T> = { [k in K]-?: T[k] } & { [k in keyof T]: T[k] }

export type GetRequiredFieldsByContext<T extends DefaultPluginsFormSchema> = T['type'] extends 'input' ? PartiallyRequired<DefaultPluginsFormSchema, 'inputType'> : DefaultPluginsFormSchema

export type DefaultPluginsSchemaRecord = Record<string, GetRequiredFieldsByContext<DefaultPluginsFormSchema>>

/**
 * Types for schemas
 */

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
    model: string
    entity: string
    placeholder: string
    inputValues: {
      fields: string[]
    },
    help: string
  },
  tags: Tags
}

export interface Item {
  inputAttributes?: any
  newElementButtonLabel?: string
}

interface ArrayItem {
  type: string
  itemContainerComponent: string
  fieldClasses: string
  fieldItemsClasses: string
  newElementButtonLabelClasses: string
  inputAttributes: {
    class: string
    style: {
      minWidth: string
    }
    [key: string]: any
  },
  removeElementButtonLabel: string
  styleClasses: string
  inputType: string
  valueType: string
  valueArrayType: string
}

export type ReturnArrayItem = ArrayItem & Item

export interface CustomSchemas {
  'application-registration': ApplicationRegistrationSchema
  datadog: DatadogSchema
  'upstream-tls': UpstreamTlsSchema
  statsd: StatsDSchema
  'statsd-advanced': StatsDAdvancedSchema
  mocking: MockingSchema
  'rate-limiting': RateLimitingSchema
  'rate-limiting-advanced': RateLimitingSchema
  'route-by-header': RouteByHeaderSchema
  'ai-prompt-decorator': AIPromptDecoratorSchema
  'ai-prompt-template': AIPromptTemplateSchema
  'ai-rate-limiting-advanced': AIRateLimitingAdvancedSchema
  'vault-auth': VaultAuthSchema
  'graphql-rate-limiting-advanced': GraphQLRateLimitingAdvancedSchema
  'response-ratelimiting': RateLimitingSchema
  'pre-function': CommonSchemaFields & Record<string, any>
  'post-function': CommonSchemaFields & Record<string, any>
  'request-transformer-advanced': CommonSchemaFields & Record<string, any>
  'request-validator': CommonSchemaFields & Record<string, any>
  zipkin: CommonSchemaFields & Record<string, any>
  saml: SAMLSchema
  'oas-validation': OasValidationSchema
  'upstream-oauth': UpstreamOauthSchema
}

export interface FormsApi {
  getOne: (entityType: string, entityId: string) => Promise<AxiosResponse>
  getAll: (entityType: string, params: AxiosRequestConfig) => Promise<AxiosResponse>
}
