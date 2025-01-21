import type { PathToDotNotation } from '@kong-ui-public/i18n/dist/types/types'

export enum PluginGroup {
  AUTHENTICATION = 'Authentication',
  AI = 'AI',
  SECURITY = 'Security',
  TRAFFIC_CONTROL = 'Traffic Control',
  SERVERLESS = 'Serverless',
  ANALYTICS_AND_MONITORING = 'Analytics & Monitoring',
  TRANSFORMATIONS = 'Transformations',
  LOGGING = 'Logging',
  DEPLOYMENT = 'Deployment',
  WEBSOCKET = 'WebSocket Plugins',
  CUSTOM_PLUGINS = 'Custom Plugins',
}

export const PluginGroupArray = [
  PluginGroup.AUTHENTICATION,
  PluginGroup.AI,
  PluginGroup.SECURITY,
  PluginGroup.TRAFFIC_CONTROL,
  PluginGroup.SERVERLESS,
  PluginGroup.ANALYTICS_AND_MONITORING,
  PluginGroup.TRANSFORMATIONS,
  PluginGroup.LOGGING,
  PluginGroup.DEPLOYMENT,
  PluginGroup.WEBSOCKET,
  PluginGroup.CUSTOM_PLUGINS,
]

export const PLUGIN_GROUPS_COLLAPSE_STATUS = {
  [PluginGroup.AUTHENTICATION]: false,
  [PluginGroup.AI]: false,
  [PluginGroup.SECURITY]: false,
  [PluginGroup.TRAFFIC_CONTROL]: false,
  [PluginGroup.SERVERLESS]: false,
  [PluginGroup.ANALYTICS_AND_MONITORING]: false,
  [PluginGroup.TRANSFORMATIONS]: false,
  [PluginGroup.LOGGING]: false,
  [PluginGroup.DEPLOYMENT]: false,
  [PluginGroup.CUSTOM_PLUGINS]: false,
}

// this is the entity associated with a specific plugin, if no associated entity, then it's a global plugin meaning EntityType will be 'plugins'
export type EntityType = 'consumers' | 'routes' | 'services' | 'consumer_groups' | 'plugins'
export enum EntityTypeIdField {
  SERVICE = 'service_id',
  ROUTE = 'route_id',
  CONSUMER = 'consumer_id',
  CONSUMER_GROUP = 'consumer_group_id',
}

export enum PluginScope {
  GLOBAL = 'global',
  SERVICE = 'service',
  ROUTE = 'route',
  CONSUMER = 'consumer',
  CONSUMER_GROUP = 'consumer_group',
}

export interface PluginEntityInfo {
  entity: PluginScope
  entityEndpoint: EntityType
  id?: string
  idField?: EntityTypeIdField
}

/**
 * Rules for fields in a plugin entity.
 * See `entity_checks` in BE schemas to learn more.
 */
export interface FieldRules {
  /**
   * An array of rules.
   *
   * Must provide at least one of the parameters in a rule.
   *
   * NOTE: See `at_least_one_of` in BE schema to learn more.
   */
  atLeastOneOf?: string[][]

  /**
   * An array of rules.
   *
   * Must provide exactly one of the parameters in a rule.
   *
   * NOTE: See `only_one_of` in BE schema to learn more.
   */
  onlyOneOf?: string[][]

  /**
   * An array of rules.
   *
   * Must provide all of the parameters in a rule if one of the parameter is provided. Otherwise,
   * none of them should be provided.
   *
   * NOTE: See `mutually_required` in BE schemas to learn more.
   */
  mutuallyRequired?: string[][]

  /**
   * An array of rules.
   *
   * Must provide exactly one combination of parameters in a rule, while all of the parameters in
   * the provided combination are required.
   *
   * For example, the following structure:
   * ```javascript
   * [
   *   [
   *     ['param1', 'param2'],
   *     ['param3', 'param4']
   *   ],
   *   [
   *     ['param5', 'param6'],
   *     ['param7', 'param8']
   *   ],
   * ]
   * ```
   * … means that:
   * - There are two independent rules
   * - In the first rule, either both `param1` and `param2` or both `param3` and `param4` are required.
   * - In the second rule, either both `param5` and `param6` or both `param7` and `param8` are required.
   *
   * NOTE: These rules are manually simplified. They does not have corresponding BE entity checks.
   */
  onlyOneOfMutuallyRequired?: string[][][]
}

export type CustomPluginType = 'schema' | 'streaming'
export type CustomPluginSupportLevel = 'none' | 'disabled' | CustomPluginType

export type PluginMetaData<I18nMessageSource = void> = {
  nameKey: I18nMessageSource extends void ? string : PathToDotNotation<I18nMessageSource, string>
  name: string // A display name of the Plugin.
  descriptionKey: I18nMessageSource extends void ? string : PathToDotNotation<I18nMessageSource, string>
  description: string // A string to describe a Plugin.
  group: PluginGroup // Plugin categories meta.
  scope: PluginScope[] // The scope supported by the Plugin.
  isEnterprise: boolean // The value will be True if the Plugin is enterprise only.
  imageName?: string // An optional tag to define plugin's icon image.
  useLegacyForm?: boolean // An optional field to use legacy form for the plugin. Default to false.
  fieldRules?: FieldRules
}

export interface PluginType extends PluginMetaData {
  id: string // the plugin schema name
  available?: boolean // whether the plugin is available or not
  exists?: boolean // whether the plugin exists already for the current entity
  disabledMessage?: string // An optional field for plugin's disabled message.
  customPluginType?: CustomPluginType // custom plugin type
}

export type DisabledPlugin = {
  [key: string]: string // [plugin.id]: plugin.disabledMessage
}

export type PluginCardList = {
  [key in PluginGroup]?: PluginType[]
}

export type TriggerLabels = {
  [key in PluginGroup]?: string // [plugin.group]: label
}

export type PluginOrdering = {
  before: {
    access: string[]
  }
  after: {
    access: string[]
  }
}

export interface CreateOrEditStreamingCustomPluginRequest {
  name: string
  schema: string
  handler: string
}

export interface StreamingCustomPluginSchema {
  id: string
  name: string
  schema: string
  handler: string
  created_at?: number
  updated_at?: number
  tags?: string[]
}
