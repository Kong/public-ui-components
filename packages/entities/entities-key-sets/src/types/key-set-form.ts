import type { RouteLocationRaw } from 'vue-router'
import { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui/entities-shared'

/** Konnect Key Set form config */
export interface KonnectKeySetFormConfig extends KonnectBaseFormConfig {
  /** Route to return to if canceling create/edit a Key Set */
  cancelRoute: RouteLocationRaw
}

/** Kong Manager Key Set form config */
export interface KongManagerKeySetFormConfig extends KongManagerBaseFormConfig {
  /** Route to return to if canceling create/edit a Key Set */
  cancelRoute: RouteLocationRaw
}

export interface KeySetFormFields {
  name: string
  tags?: string
}

export interface KeySetFormState {
  /** Form fields */
  fields: KeySetFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}
