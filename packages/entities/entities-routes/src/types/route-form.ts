import type { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'
import type { Methods, Method } from './method-badge'

export interface BaseRouteFormConfig extends Omit<BaseFormConfig, 'cancelRoute'>{
  /** Route to return to if canceling create/edit a Route form */
  cancelRoute: RouteLocationRaw
}

/** Konnect Route form config */
export interface KonnectRouteFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseRouteFormConfig { }

/** Kong Manager Route form config */
export interface KongManagerRouteFormConfig extends Omit<KongManagerBaseFormConfig, 'cancelRoute'>, BaseRouteFormConfig { }

export enum RoutingRulesEntities {
  PATHS = 'paths',
  SNIS = 'snis',
  HOSTS = 'hosts',
  METHODS = 'methods',
  HEADERS = 'headers',
  SOURCES = 'sources',
  DESTINATIONS = 'destinations',
  CUSTOM_METHOD = 'custom-method'
}

export type RoutingRuleEntity = Exclude<`${RoutingRulesEntities}`, 'custom-method'>

export type PathHandlingVersion = 'v0' | 'v1'

export type Protocol = 'grpc' | 'grpcs' | 'http' | 'https' | 'tcp' | 'tls' | 'tls_passthrough' | 'udp' | 'ws' | 'wss'

export interface HeaderFields {
  header: string
  values: string
}

export type MethodsFields = {
  [key in Methods | string]: boolean
}

export interface SourcesDestinationsFields {
  ip: string
  port: number
}

export interface Sources extends SourcesDestinationsFields { }

export interface Destinations extends SourcesDestinationsFields { }

export interface RouteStateFields {
  service_id: string
  name: string
  tags: string
  regex_priority: number
  path_handling: PathHandlingVersion
  preserve_host: boolean
  https_redirect_status_code: number
  protocols: string
  request_buffering: boolean
  response_buffering: boolean
  strip_path: boolean
  paths?: string[]
  snis?: string[]
  hosts?: string[]
  methods?: MethodsFields
  headers?: HeaderFields[]
  sources?: Sources[]
  destinations?: Destinations[]
}

export interface RouteState {
  fields: RouteStateFields
  isReadonly: boolean
  errorMessage: string
}

export interface Headers {
  [key: string]: string[]
}

export interface RoutePayload {
  id?: string
  service: { id: string } | null
  name?: string | null
  tags: string[]
  regex_priority: number
  path_handling: PathHandlingVersion
  preserve_host: boolean
  https_redirect_status_code: number
  protocols: Protocol[]
  request_buffering: boolean
  response_buffering: boolean
  strip_path?: boolean | null
  paths?: string[] | null
  snis?: string[] | null
  hosts?: string[] | null
  methods?: Array<Method | string> | null
  headers?: Headers | null
  sources?: Sources[] | null
  destinations?: Destinations[] | null
}
