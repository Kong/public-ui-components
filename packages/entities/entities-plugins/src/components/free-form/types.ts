import type { FormConfig, FieldRendererRule, RenderRules, FormSchema } from '@kong-ui-public/freeform'
import type { FreeFormPluginData } from '../../types/plugins/free-form'
import type { Component, Ref } from 'vue'

// TODO: check lua_schema type
export interface Field {
  label: string
  model: string
  type?: string
  default?: any
  disabled?: boolean
  help?: string
  inputType?: string
  order?: number
  required?: boolean
  valueType?: string
}

export interface Redis {
  host?: string | null
  port?: number | null
  connect_timeout?: number | null
  send_timeout?: number | null
  read_timeout?: number | null
  /**
   * @description referenceable: true
   */
  username?: string | null
  /**
   * @description referenceable: true
   */
  password?: string | null
  /**
   * @description referenceable: true
   */
  sentinel_username?: string | null
  /**
   * @description referenceable: true
   */
  sentinel_password?: string | null
  database?: number | null
  keepalive_pool_size?: number | null
  keepalive_backlog?: number | null
  sentinel_master?: string | null
  sentinel_role?: 'master' | 'slave' | 'any' | null
  sentinel_nodes?: RedisSentinelNode[] | null // `"len_min": 1`
  cluster_nodes?: RedisClusterNode[] | null // `"len_min": 1`
  ssl?: boolean
  ssl_verify?: boolean
  server_name?: string | null
  cluster_max_redirections?: number | null
  connection_is_proxied?: boolean
}

export type RedisPartialType = 'redis-ce' | 'redis-ee'

export type RedisTypeDisplay = 'Host/Port' | 'Sentinel' | 'Cluster'

export interface RedisConfig {
  name: string
  type: RedisPartialType
  config: Redis
}

export interface FlattendRedisConfigurationFields extends Redis {
  name: string
  created_at: string
  updated_at: string
  type: RedisPartialType
}
export interface RedisSentinelNode {
  host: string
  port?: number | null
}

export interface RedisClusterNode {
  ip: string
  port?: number | null
}

export type PartialInfo = {
  redisType: Ref<RedisPartialType | undefined>
  redisPath: Ref<string | undefined>
  isEditing: boolean
}

export type PartialNotification = {
  message: string
  appearance: string
}

export type PluginConfigurationBaseProps<T extends Record<string, any> = Record<string, any>> = {
  /** FreeForm Schema */
  schema: FormSchema
  /** The **initial** entire plugin model, never update */
  model: T
  /** Emits the final submission payload to the parent, the payload will be merged with the `formModel` but it has high override priority */
  onFormChange: (value: Partial<T>, fields?: string[]) => void
  /** FreeForm configuration */
  formConfig?: FormConfig<T>
  renderRules?: RenderRules
  fieldRenderers?: FieldRendererRule[]
  pluginName: string
  /** Konnect-managed Redis UI, from plugin form config */
  isKonnectManagedRedisEnabled?: boolean
}

/**
 * Describes one numbered configuration step in a multi-section plugin layout.
 * Content for each section is provided by the layout consumer via a
 * `#section-<name>` slot.
 */
export interface ConfigSection {
  /** Unique section key; the layout renders content from the `#section-<name>` slot */
  name: string
  /** Step block title */
  title?: string
  /** Step block description */
  description?: string
}

export type PluginFormLayoutProps<T extends FreeFormPluginData = FreeFormPluginData> = PluginConfigurationBaseProps<T> & {
  onValidityChange?: (event: { model: string, valid: boolean, error?: Error | string }) => void
  isEditing: boolean
  /**
   * Optional multi-section configuration layout. When provided, the single
   * "Plugin Configuration" step is replaced by one numbered step block per
   * section (steps 2..N), each rendered via its `#section-<name>` slot, and the
   * General Info step is renumbered to `2 + configSections.length`. When
   * omitted, the layout renders the default single config step (step 2) using
   * the default slot — i.e. existing plugins are unaffected.
   */
  configSections?: ConfigSection[]
  /**
   * Hide the built-in form/code switcher. Plugins that own a custom switcher
   * (e.g. Datakit's flow/code control) should set this to true to avoid
   * rendering duplicate controls into #plugin-form-page-actions.
   */
  hideEditorModeSwitcher?: boolean
  /** Whether the plugin is being created for a portal developer */
  developer?: boolean
  generalInfoTitle?: string
  generalInfoDescription?: string
  pluginConfigTitle?: string
  pluginConfigDescription?: string
}

export type PluginFormLayoutComponent<T extends FreeFormPluginData = FreeFormPluginData> = Component<PluginFormLayoutProps<T>>

type ComponentBasedConfig = {
  /**
   * Form-level custom component.
   * Receives `PluginFormLayoutProps`.
   *
   * A custom component owns its own rendering rules and field renderers: pass
   * `render-rules` to its layout and register renderers via the `#field-renderers`
   * slot inside the component instead of configuring them here.
   */
  component: PluginFormLayoutComponent<any>
  renderRules?: never
  fieldRenderers?: never
}

type RuleBasedConfig = {
  /**
   * Rendered with the default `CommonForm`.
   */
  component?: never
  /**
   * Form-level rendering rules.
   */
  renderRules?: RenderRules
  /**
   * Field-level custom renderers.
   */
  fieldRenderers?: FieldRendererRule[]
}

export type PluginFormConfig = {
  /**
   * Whether the plugin is experimental.
   * Experimental plugins will only be rendered when their names are included in the `EXPERIMENTAL_FREE_FORM_PROVIDER` provider.
   */
  experimental?: boolean
} & (ComponentBasedConfig | RuleBasedConfig)
