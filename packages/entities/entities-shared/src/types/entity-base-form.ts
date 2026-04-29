import type { RouteLocationRaw } from 'vue-router'
import type { KonnectConfig, KongManagerConfig } from './index'
import type { DeckConfigOptions } from './deck'

export interface BaseFormConfig {
  /** Route to return to if canceling create/edit an entity */
  cancelRoute?: RouteLocationRaw
  /** If showing an edit form, the ID of the entity to edit */
  editId?: string
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
