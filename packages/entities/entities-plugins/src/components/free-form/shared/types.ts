import type { UnionFieldSchema } from '../../../types/plugins/form-schema'
import type { ComponentPublicInstance, Ref, Slot } from 'vue'

type ComponentPublicInstanceConstructor = {
  new (...args: any[]): ComponentPublicInstance<any>
}

export type PropType<T extends ComponentPublicInstanceConstructor> =
  InstanceType<T>['$props'] & { [key: string]: unknown }


export type FormConfig<T extends Record<string, any> = Record<string, any>> = {
  prepareFormData?: (data: any) => any
  transformLabel?: (label: string, fieldPath: string) => string
  hasValue?: (data: T | undefined) => boolean
  /**
   * Sync value after `change` event for every text-like input.
   */
  updateOnChange?: boolean
}

/**
 * Defines how the form field's label path should be constructed.
 */
export type ResetLabelPathRule =
  | 'inherit' // Default, both current and descendants inherit the path.
  | 'reset' // Both current and descendants discard the parent path and start from current path.
  | 'reset-children' // Inherit paths on its own, but descendant paths start from current path.
  | 'isolate' // Isolate paths for both current and descendants.
  | 'isolate-children' // Inherit paths on its own, children do not inherit.
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

/**
 * Global action that any field can trigger
 * @deprecated use `useToaster` instead
 */
export type GlobalAction = 'notify'

/**
 * Override options for string fields.
 */
export interface StringFieldOverride {
  /** Render as textarea instead of single-line input */
  multiline?: boolean
  /** Number of rows for textarea (only applies when multiline is true) */
  rows?: number
  /** Show vault secret picker */
  showVaultSecretPicker?: boolean
  /** Show password mask toggle */
  showPasswordMaskToggle?: boolean
  /** Input type (e.g., 'password', 'text') */
  inputType?: string
  /** Custom placeholder text */
  placeholder?: string
}

/**
 * Override options for number fields.
 */
export interface NumberFieldOverride {
  /** Show vault secret picker */
  showVaultSecretPicker?: boolean
  /** Minimum value */
  min?: number | string
  /** Maximum value */
  max?: number | string
}

/**
 * Override options for array fields.
 */
export interface ArrayFieldOverride {
  /** Display appearance: 'default', 'card', or 'tabs' */
  appearance?: 'default' | 'card' | 'tabs'
  /** Make tabs sticky (for 'tabs' appearance) */
  stickyTabs?: boolean | string | number
  /** Custom item label */
  itemLabel?: string
}

/**
 * Override options for object/record fields.
 */
export interface ObjectFieldOverride {
  /** Whether the object is added by default */
  defaultAdded?: boolean
  /** Whether the object is collapsible */
  collapsible?: boolean
  /** Display appearance: 'card' or 'default' */
  appearance?: 'card' | 'default'
  /** Fields to omit from rendering */
  omit?: string[]
  /** Render as child without wrapper */
  asChild?: boolean
  /** Custom field order */
  fieldsOrder?: string[]
}

/**
 * Override options for enum/select fields.
 */
export interface EnumFieldOverride {
  /** Allow multiple selection */
  multiple?: boolean
  /** Custom placeholder text */
  placeholder?: string
}

/**
 * Override options for key-value/map fields.
 */
export interface KeyValueFieldOverride {
  /** Show vault secret picker for values */
  showVaultSecretPicker?: boolean
  /** Placeholder for key input */
  keyPlaceholder?: string
  /** Placeholder for value input */
  valuePlaceholder?: string
}

/**
 * Override options for string array fields (tag input).
 */
export interface StringArrayFieldOverride {
  /** Render as multiline textarea */
  multiline?: boolean
}

/**
 * Union type of all field override options.
 * Use the appropriate interface based on the field's schema type.
 */
export type FieldOverride =
  | StringFieldOverride
  | NumberFieldOverride
  | ArrayFieldOverride
  | ObjectFieldOverride
  | EnumFieldOverride
  | KeyValueFieldOverride
  | StringArrayFieldOverride

/**
 * Rules to control the rendering of form fields.
 * Only `Form` and `ObjectField` components can accept these rules
 */
export interface RenderRules {
  /**
   * Bundles of fields to be rendered together.
   * - Each bundle is an array of field paths.
   * - Each bundle should be in the same level.
   * - Circular references between bundles are not allowed.
   * @example
   * ```ts
   * [
   *   ['config.username', 'config.password'], // first bundle
   *   ['config.strategy', 'config.redis'], // second bundle
   *   ['config.strategy', 'config.cache.redis'], // ❌ different levels are not allowed
   *   ['config.redis', 'config.strategy'], // ❌ circular reference not allowed
   * ]
   */
  bundles?: string[][]

  /**
   * Dependencies between fields to control their visibility.
   * - A field will be shown only if its dependency is satisfied.
   * - A field will only have a value if its dependency is satisfied.
   * - The `fieldValue` will be deeply compared.
   * - Field and its dependency should be in the same level.
   * - Circular dependencies are not allowed.
   * @example
   * ```ts
   * {
   *   'config.redis': ['config.strategy', 'redis'],
   *   'config.cache.redis': ['config.strategy', 'cache'], // ❌ different levels are not allowed
   *   'config.strategy': ['config.redis', {}], // ❌ circular dependency not allowed
   * }
   * ```
   */
  dependencies?: {
    [fieldPath: string]: [fieldPath: string, fieldValue: any]
  }

  /**
   * Override rendering options for specific fields.
   * @example
   * ```ts
   * {
   *   'config.body_template': { multiline: true, rows: 4 },
   *   'config.headers': { appearance: 'card' },
   *   'config.strategy': { placeholder: 'Select a strategy' },
   * }
   * ```
   */
  fieldOverrides?: {
    [fieldPath: string]: FieldOverride
  }
}

export interface BaseFieldProps {
  name: string
}

export type Match = (opt: {
  path: string
  schema: UnionFieldSchema
}) => boolean

export type MatchMap = Map<Match, Slot<{ name: string }>>
