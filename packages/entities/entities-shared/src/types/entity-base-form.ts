import type { RouteLocationRaw } from 'vue-router'
import type { KonnectConfig, KongManagerConfig } from './index'

export interface BaseFormConfig {
  /** Route to return to if canceling create/edit an entity */
  cancelRoute?: RouteLocationRaw
  /** If showing an edit form, the ID of the entity to edit */
  editId?: string
}

/** Konnect base form config */
export interface KonnectBaseFormConfig extends KonnectConfig, BaseFormConfig {
  /** Whether to enable the deck tab */
  enableDeckTab?: boolean
}

/** Kong Manager base form config */
export interface KongManagerBaseFormConfig extends KongManagerConfig, BaseFormConfig {}

export enum EntityBaseFormType {
  Edit = 'edit',
  Create = 'create',
}
