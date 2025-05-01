import type { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'
import type { Method, Methods } from './method-badge'
import type { PROTOCOLS_TO_ROUTE_RULES } from '../constants'

export enum RouteFlavor {
  TRADITIONAL = 'traditional', // includes traditional_compatible
  EXPRESSIONS = 'expressions',
}

/** An object to mark route flavors supported */
export interface RouteFlavors {
  traditional?: boolean
  expressions?: boolean
}

export interface BaseRouteFormConfig extends Omit<BaseFormConfig, 'cancelRoute'> {
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
  CUSTOM_METHOD = 'custom-method',
}

export enum ExpressionsEditorState {
  LOADING = 'loading',
  ERROR = 'error',
  READY = 'ready',
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

export interface BaseRouteStateFields {
  name: string
  protocols: keyof typeof PROTOCOLS_TO_ROUTE_RULES
  service_id: string
  tags: string
}

export interface SharedRouteRulesFields {
  https_redirect_status_code: number
  strip_path: boolean
  preserve_host: boolean
  request_buffering: boolean
  response_buffering: boolean
}

/** These are traditional-only fields */
export interface TraditionalRouteRulesFields extends SharedRouteRulesFields {
  methods?: MethodsFields
  hosts?: string[]
  paths?: string[]
  headers?: HeaderFields[]
  regex_priority?: number
  path_handling: PathHandlingVersion
  sources?: Sources[]
  destinations?: Destinations[]
  snis?: string[]
}

/** These are expression-only fields */
export interface ExpressionsRouteRulesFields extends SharedRouteRulesFields {
  expression: string // Not required now, as described in Kong/kong#12667
  priority: number
}

export interface RouteState<Fields extends BaseRouteStateFields> {
  routeFlavors: RouteFlavors // For better type narrowing
  fields: Fields
  isReadonly: boolean
  errorMessage: string
}

/** Type narrowing down helper function */
export const stateHasTraditionalFlavor = (state: RouteState<BaseRouteStateFields>): state is RouteState<BaseRouteStateFields & TraditionalRouteRulesFields> =>
  state.routeFlavors.traditional === true

/** Type narrowing down helper function */
export const stateHasExpressionsFlavor = (state: RouteState<BaseRouteStateFields>): state is RouteState<BaseRouteStateFields & ExpressionsRouteRulesFields> =>
  state.routeFlavors.expressions === true

export interface Headers {
  [key: string]: string[]
}

export interface BaseRoutePayload {
  id?: string
  name?: string | null
  protocols: Protocol[]
  tags: string[]
  service: { id: string } | null
}

export interface SharedRouteRulesPayload {
  https_redirect_status_code: number
  strip_path?: boolean | null // `null` does not seems to be used but keeping it here just in case
  preserve_host: boolean
  request_buffering: boolean
  response_buffering: boolean
}

/** Extra payload for traditional-flavored routes */
export interface TraditionalRouteRulesPayload extends SharedRouteRulesPayload {
  methods?: Array<Method | string> | null
  hosts?: string[] | null
  paths?: string[] | null
  headers?: Headers | null
  regex_priority: number
  path_handling: PathHandlingVersion
  sources?: Sources[] | null
  destinations?: Destinations[] | null
  snis?: string[] | null
}

/** Extra payload for expressions-flavored routes */
export interface ExpressionsRouteRulesPayload extends SharedRouteRulesPayload {
  expression?: string // Not required now, as described in Kong/kong#12667
  priority: number
}

export type TypedRouteRulesPayload = {
  type: RouteFlavor.TRADITIONAL
  payload: TraditionalRouteRulesPayload
} | {
  type: RouteFlavor.EXPRESSIONS
  payload: ExpressionsRouteRulesPayload
}
