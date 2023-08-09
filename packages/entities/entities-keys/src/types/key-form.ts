import type { RouteLocationRaw } from 'vue-router'
import { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'

/** Konnect Key form config */
export interface KonnectKeyFormConfig extends KonnectBaseFormConfig {
  /** Route to return to if canceling create/edit a Key */
  cancelRoute: RouteLocationRaw
}

/** Kong Manager Key form config */
export interface KongManagerKeyFormConfig extends KongManagerBaseFormConfig {
  /** Route to return to if canceling create/edit a Key */
  cancelRoute: RouteLocationRaw
}

export interface KeyFormFields {
  key_id: string
  key_format: 'jwk' | 'pem',
  name?: string
  key_set?: string
  tags?: string
  jwk?: string
  private_key?: string
  public_key?: string
}

export interface KeyFormState {
  /** Form fields */
  fields: KeyFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}

// TODO: This should be exposed from Kongponents, but isn't
export interface SelectItem {
  label: string
  value: string | number
  selected?: boolean
  name: string
}
