import type { RouteLocationRaw } from 'vue-router'
import type { KonnectConfig, KongManagerConfig } from './index'
import type { DeckConfigOptions } from './deck'

/** Metering & billing related configuration, consumed by Entitlement Enforcement/metering plugin forms */
export interface MeteringConfig {
  /** Endpoint the Entitlement Enforcement FeatureSelectField fetches the OpenMeter features list from */
  featuresEndpoint?: string
  /**
   * Whether the current user can list OpenMeter features (precomputed by the host app,
   * e.g. from Metering & Billing being enabled and the relevant permission). When
   * explicitly `false`, the Entitlement Enforcement feature select is disabled and a warning alert
   * guides the user to enable Metering & Billing in Konnect. Omitted/`true` = allowed.
   */
  canListFeatures?: boolean
  /**
   * Whether the current user can create OpenMeter features (precomputed by the host app).
   * When explicitly `false`, the "New feature" action in the Entitlement Enforcement feature select is
   * hidden. Omitted/`true` = shown; clicking it emits `click:create-entity`.
   */
  canCreateFeature?: boolean
}

export interface BaseFormConfig {
  /** Route to return to if canceling create/edit an entity */
  cancelRoute?: RouteLocationRaw
  /** If showing an edit form, the ID of the entity to edit */
  editId?: string
  /** Metering & billing related configuration */
  metering?: MeteringConfig
}

/** Konnect base form config */
export interface KonnectBaseFormConfig extends KonnectConfig, BaseFormConfig {
  /** Whether to enable the deck tab */
  enableDeckTab?: boolean | DeckConfigOptions
}

/** Kong Manager base form config */
export interface KongManagerBaseFormConfig extends KongManagerConfig, BaseFormConfig {
  /**
   * The localStorage key to use while persisting the visibility preference for the
   * decK format callout. Omitting this will hide the callout in any case.
   */
  deckCalloutPreferenceKey?: string
}

export enum EntityBaseFormType {
  Edit = 'edit',
  Create = 'create',
}

// Runtime list of every tab in the configuration slideout
export const BASE_FORM_CONFIG_TABS = ['json', 'yaml', 'terraform', 'deck'] as const

// Union of all configuration slideout tab values
export type BaseFormConfigTab = (typeof BASE_FORM_CONFIG_TABS)[number]
