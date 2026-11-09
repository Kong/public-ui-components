import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { CustomPluginType, EntityType } from './plugin'

export interface BasePluginSelectConfig {
  /** A function that returns the route for creating a plugin */
  getCreateRoute: (id: string) => RouteLocationRaw
  /** Route for creating a custom plugin */
  createCustomRoute?: RouteLocationRaw
  /** A function that returns the route for editing a custom plugin */
  getCustomEditRoute?: (id: string, type: CustomPluginType) => RouteLocationRaw
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

  viewServiceRoute?: (id: string) => RouteLocationRaw
  viewRouteRoute?: (id: string) => RouteLocationRaw
  viewConsumerRoute?: (id: string) => RouteLocationRaw
  viewConsumerGroupRoute?: (id: string) => RouteLocationRaw
  viewCertificateRoute?: (id: string) => RouteLocationRaw
}

export interface KongManagerPluginSelectConfig extends BasePluginSelectConfig, KongManagerBaseFormConfig { }

/** Konnect Plugin form config */
export interface KonnectPluginSelectConfig extends BasePluginSelectConfig, KonnectBaseFormConfig { }

export interface KonnectPluginFormConfig extends BasePluginFormConfig, KonnectBaseFormConfig {
  /** When true, CP is a Cloud Gateway. Enables Konnect-managed Redis copy and grouping */
  isCloudGateway?: boolean
  /**
   * KRN-based permission flag from the host app (gateway-manager).
   * When explicitly `false`, the auth server KSelect falls back to a plain text issuer
   * input and the client KSelect falls back to a plain text client id input.
   */
  isKongIdentityAuthServersAvailable?: boolean
  /**
   * KRN-based permission flag from the host app (gateway-manager).
   * When explicitly `false`, the "Create authorization server" dropdown action is hidden
   * (the user can still view/select existing servers via isKongIdentityAuthServersAvailable).
   */
  canCreateAuthServer?: boolean
  /**
   * KRN-based permission flag from the host app (gateway-manager).
   * When explicitly `false`, the "Create client" dropdown action is hidden for the
   * selected authorization server (the user can still view/select existing clients).
   */
  canCreateAuthServerClient?: boolean
  /**
   * Resolved Kong Identity directory name for the current control plane, precomputed by the
   * host app. The host must already resolve the directory ID to evaluate the KRN-scoped
   * principals permission below (`krn:idp:.../directories/{id}/principals`), so re-fetching
   * `/v2/directories` here too would be redundant and subject to the same permission gap.
   * `undefined` means the host hasn't resolved this yet (drives a loading state); `null`
   * means resolved but there's no accessible directory.
   */
  principalsDirectoryName?: string | null
  /**
   * Whether to show the "Add principals" empty-state guide, precomputed by the host app via:
   * directory access → directory retrieved → principals (list) access on that directory →
   * principals list is empty → create-principal permission. All must hold for this to be
   * `true`; there is no other circumstance where it should be. `undefined` means not yet
   * resolved (drives a loading state).
   */
  principalsCreationGuideVisible?: boolean
  /**
   * Kong Gateway versions of the data plane nodes connected to the current control plane
   * (deduped). Used to warn when Kong Identity principals — which require Gateway 3.15+ —
   * are configured but a connected DP node can't process them.
   */
  dataPlaneVersions?: string[]
}

/** Kong Manager Plugin form config */
export interface KongManagerPluginFormConfig extends BasePluginFormConfig, KongManagerBaseFormConfig { }

/**
 * Payload for the `click:create-entity` event. The consuming app navigates to the
 * matching create page. Emitted from the Kong Identity principals UI (`principal`,
 * `auth-server`, `client`) and from the Entitlement Enforcement feature select (`feature`);
 * `authServerId` is provided when creating a client (scoped to the selected auth server).
 */
export type EntityCreateEvent = {
  type: 'principal'
} | {
  type: 'auth-server'
} | {
  type: 'client'
  authServerId?: string
} | {
  type: 'feature'
}

export interface PluginFormFields {
  enabled: boolean
  name?: string
  instance_name?: string
  condition?: string | null
  protocols: string[]
  tags: string[]
  [key: string]: any
}

export interface PluginFormState {
  /** Form fields */
  fields: PluginFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message collected from client-side validation */
  clientErrorMessage: string
  /** The error message extracted from server response */
  serverErrorMessage: string
}

export type PartiallyRequired<T, K extends keyof T> = { [k in K]-?: T[k] } & { [k in keyof T]: T[k] }

/**
 * Types for schemas
 */

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
  }
  removeElementButtonLabel: string
  styleClasses: string
  inputType: string
  valueType: string
  valueArrayType: string
}

export type ReturnArrayItem = ArrayItem & Item

export enum PluginPartialType {
  REDIS_CE = 'redis-ce',
  REDIS_EE = 'redis-ee',
}

export interface PluginValidityChangeEvent {
  model: string
  valid: boolean
  error?: Error | string
}
