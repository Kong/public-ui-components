import { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import { RouteLocationRaw } from 'vue-router'
import { SelectItem } from '@kong/kongponents'

export interface BaseUpstreamsFormConfig extends Omit<BaseFormConfig, 'cancelRoute'> {
  cancelRoute: RouteLocationRaw
}

export interface KonnectUpstreamsFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseUpstreamsFormConfig {}

export interface KongManagerUpstreamsFormConfig extends Omit<KongManagerBaseFormConfig, 'cancelRoute'>, BaseUpstreamsFormConfig {}

export type UpstreamAlgorithm = 'round-robin' | 'least-connections' | 'consistent-hashing' | 'latency'

export type UpstreamHash = 'none' | 'consumer' | 'ip' | 'header' | 'cookie' | 'path' | 'query_arg' | 'uri_capture'

export type HealthCheckType = 'http' | 'https' | 'tcp' | 'grpc' | 'grpcs'

export interface ActiveHealthCheckHeader { key: string; values: string }

export interface ActiveHealthCheck {
  type: HealthCheckType
  httpPath: string
  timeout: string
  concurrency: string
  httpsSni: string
  verifySsl: boolean
  headers: ActiveHealthCheckHeader[]
  interval: string
  successes: string
  httpStatuses: string[]
  unhealthyInterval: string
  httpFailures: string
  tcpFailures: string
  unhealthyHttpStatuses: string[]
  unhealthyTimeouts: string
}

export interface PassiveHealthCheck {
  type: HealthCheckType
  successes: string
  httpStatuses: string[]
  timeouts: string
  httpFailures: string
  unhealthyHttpStatuses: string[]
  tcpFailures: string
}

export interface UpstreamFormFields {
  name: string
  hostHeader: string
  clientCertificate: string
  tags: string
  algorithm: UpstreamAlgorithm
  slots: string
  hashOn: UpstreamHash
  hashFallback:UpstreamHash
  hashOnHeader: string
  hashOnCookie: string
  hashOnCookiePath: string
  hashOnQueryArgument: string
  hashOnUriCapture: string
  hashFallbackHeader: string
  hashFallbackQueryArgument: string
  hashFallbackUriCapture: string
  activeHealthSwitch: boolean
  passiveHealthSwitch: boolean
  healthchecksThreshold: string
  activeHealthCheck: ActiveHealthCheck
  passiveHealthCheck: PassiveHealthCheck
}

export interface UpstreamFormState {
  fields: UpstreamFormFields
  readonly: boolean
  errorMessage: string
}

export interface AlgorithmSelectItem extends Omit<SelectItem, 'value'> {
  value: UpstreamAlgorithm
}

export interface HashSelectItem extends Omit<SelectItem, 'value'> {
  value: UpstreamHash
}

export interface HealthCheckTypeSelectItem extends Omit<SelectItem, 'value'> {
  value: HealthCheckType
}

export interface MultiselectComposableOptions {
  replaceId?: boolean
}

export interface UpstreamActivePayload {
  type: HealthCheckType
  timeout?: number
  concurrency?: number
  http_path?: string
  headers?: Record<string, string[]> | []
  https_sni?: string
  https_verify_certificate?: boolean
  healthy: {
    interval?: number
    successes?: number
    http_statuses?: number[]
  }
  unhealthy: {
    interval?: number
    timeouts?: number
    tcp_failures?: number
    http_failures?: number
    http_statuses?: number[]
  }
}

export interface UpstreamActiveResponse extends Omit<UpstreamActivePayload, 'headers'> {
  headers?: Record<string, string[]>
}

export interface UpstreamPassivePayload {
  type: HealthCheckType
  healthy: {
    successes?: number
    http_statuses?: number[]
  }
  unhealthy: {
    timeouts?: number
    http_statuses?: number[]
    http_failures?: number
    tcp_failures?: number
  }
}

export interface UpstreamFormPayload {
  name: string
  algorithm: UpstreamAlgorithm
  host_header?: string
  client_certificate?: { id: string }
  tags?: string[]
  slots: number
  hash_on: UpstreamHash
  hash_fallback:UpstreamHash
  hash_on_header?: string
  hash_on_cookie?: string
  hash_on_cookie_path?: string
  hash_on_query_arg?: string
  hash_on_uri_capture?: string
  hash_fallback_header?: string
  hash_fallback_query_arg?: string
  hash_fallback_uri_capture?: string
  healthchecks: {
    threshold?: number
    active?: UpstreamActivePayload
    passive?: UpstreamPassivePayload
  }
}

export interface UpstreamResponse extends Omit<UpstreamFormPayload, 'healthchecks'> {
  id: string,
  healthchecks: {
    threshold?: number
    active?: UpstreamActiveResponse
    passive?: UpstreamPassivePayload
  }
}

export type UpstreamsFormActions = 'validate' | 'create' | 'edit'
