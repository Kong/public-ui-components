import type { FreeFormPluginData } from '../../../types/plugins/free-form'

export type AIMcpProxyPlugin = FreeFormPluginData<AIMcpProxy>

export interface AIMcpProxy {
  logging: Logging
  server?: Server
  tools?: Tool[]
  default_acl?: DefaultACL[]
  max_request_body_size?: number | null
}

/************************************************
 *                    Logging                   *
 ************************************************/

export interface Logging {
  log_statistics: boolean
  log_payloads: boolean
}

/************************************************
 *                    Server                    *
 ************************************************/

export interface Server {
  enabled?: boolean
  tag?: string | null
  timeout?: number | null
}

/************************************************
 *                     Tool                     *
 ************************************************/

export interface Tool {
  description: string
  host?: string | null
  path?: string | null
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | null
  scheme?: 'http' | 'https' | null
  parameters?: Record<string, any> | null
  request_body?: Record<string, any> | null
  headers?: Record<string, string[]> | null
  query?: Record<string, string[]> | null
  annotations?: {
    title?: string | null
    read_only_hint?: boolean
    destructive_hint?: boolean
    idempotent_hint?: boolean
    open_world_hint?: boolean
  }
}

export interface DefaultACL {
  allow: string[]
  deny: string[]
  scope: string
}
