import type { ComponentPublicInstance, Ref } from 'vue'

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
