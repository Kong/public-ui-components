import type { RouteLocationRaw } from 'vue-router'
import { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'

/** Konnect SNI form config */
export interface KonnectSniFormConfig extends KonnectBaseFormConfig {
  /** Route to return to if canceling create/edit a SNI */
  cancelRoute: RouteLocationRaw
  /** Certificate to bind the SNI to on creation */
  certificateId?: string
}

/** Kong Manager SNI form config */
export interface KongManagerSniFormConfig extends KongManagerBaseFormConfig {
  /** Route to return to if canceling create/edit a SNI */
  cancelRoute: RouteLocationRaw
  /** Certificate to bind the SNI to on creation */
  certificateId?: string
}

export interface SniFormFields {
  name: string
  tags: string
  certificate_id: string
}

export interface SniFormState {
  /** Form fields */
  fields: SniFormFields
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
}
