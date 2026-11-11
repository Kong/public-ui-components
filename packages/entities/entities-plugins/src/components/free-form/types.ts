import type { FormConfig, FieldRendererRule, RenderRules, FormSchema } from '@kong-ui-public/freeform'
import type { Component, Ref, Slot } from 'vue'
import type { SelectItem } from '@kong/kongponents'

export type FreeFormPluginData<
  TConfig extends Record<string, any> = any,
  TUIData extends Record<string, any> = Record<string, any>,
> = {
  config?: TConfig
  /**
   * Expression twins of the `expressible` fields in `config`, mirroring its
   * structure. A root-level sibling of `config`, not part of it.
   */
  expressions?: Record<string, any> | null
  instance_name?: string
  condition?: string | null
  partials?: Array<{ id: string, path?: string }> | null
  protocols?: string[]
  __ui_data?: TUIData
  consumer_group?: { id: string } | null
  consumer?: { id: string } | null
  enabled?: boolean
  name?: string
  route?: { id: string } | null
  service?: { id: string } | null
  tags?: string[]
}

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

export type PluginConfigurationBaseProps<T extends Record<string, any> = Record<string, any>> = {
  /** FreeForm Schema */
  schema: FormSchema
  /** The **initial** entire plugin model, never update */
  model: T
  /**
   * Emits the plugin data to the parent.
   * `PluginForm` submits the value as the payload (adding the plugin `name`), so a layout used in it
   * must emit every field it controls, e.g. `config`, `enabled`, the scope, `protocols` and `tags`, not only `config`.
   */
  onFormChange: (value: Partial<T>, fields?: string[]) => void
  /** FreeForm configuration */
  formConfig?: FormConfig<T>
  renderRules?: RenderRules
  fieldRenderers?: FieldRendererRule[]
  pluginName: string
  /** Konnect-managed Redis UI, from plugin form config */
  isKonnectManagedRedisEnabled?: boolean
}

export type PluginScopeName = 'service' | 'route' | 'consumer' | 'consumer_group'

/** A scope entity field, e.g. the Gateway Service select */
export interface PluginScopeEntityField {
  name: PluginScopeName
  /** Kong entity type, e.g. `services` */
  entity: string
  label: string
  placeholder: string
  help: string
  /** The entity key to show as the item label */
  labelField: string
  /** The entity keys to search and show */
  fields: string[]
  disabled: boolean
  disabledTooltip: string
}

/** The plugin scope options of the standard layout */
export interface PluginScopeOptions {
  /** Disable switching between global and scoped */
  disabled: boolean
  global: { label: string, description: string }
  /** The scoped option, absent when the plugin can't be scoped */
  scoped?: { label: string, description: string }
  entityFields: PluginScopeEntityField[]
  /** The scope preselected when a plugin is created under an entity */
  defaults: Partial<Record<PluginScopeName, { id: string }>>
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
  /** The plugin scope options from `PluginForm`, the standard layout's scope section is empty without them */
  scopeOptions?: PluginScopeOptions
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

export type PluginFormConfig = ComponentBasedConfig | RuleBasedConfig

export interface AutofillSlotProps {
  schema: Record<string, any>
  value: any
  update: (value: any) => void
  /**
   * Set when the host field is disabled (e.g. by freeform's version
   * compatibility check) — the autofill/vault-picker UI should not be
   * interactive while this is true.
   */
  disabled?: boolean
}

export type AutofillSlot = Slot<AutofillSlotProps>

/** A Kong entity, e.g. a Gateway Service */
export interface EntityData {
  [key: string]: any
  id: string
}

export interface EntityResponse {
  data: EntityData[]
  next?: string
  offset?: string
}

export type EntityItemTransformer = (item: EntityData) => SelectItem<string>
