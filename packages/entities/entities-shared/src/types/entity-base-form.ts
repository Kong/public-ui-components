import type { RouteLocationRaw } from 'vue-router'
import type { KonnectConfig, KongManagerConfig } from './index'

export interface BaseFormConfig {
  /** Route to return to if canceling create/edit an entity */
  cancelRoute?: RouteLocationRaw
  /** If showing an edit form, the ID of the entity to edit */
  editId?: string
  /**
   * Feature flag value for JSON/YAML Milestone 2: `Khcp-9892-json-yaml-milestone-2`
   * TODO: Remove jsonYamlFormsEnabled once FF is enabled
   */
  jsonYamlFormsEnabled?: boolean
}

/** Konnect base form config */
export interface KonnectBaseFormConfig extends KonnectConfig, BaseFormConfig {}

/** Kong Manager base form config */
export interface KongManagerBaseFormConfig extends KongManagerConfig, BaseFormConfig {}

export enum EntityBaseFormType {
  Edit = 'edit',
  Create = 'create',
}
