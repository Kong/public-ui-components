import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface BaseTargetFormConfig {
  upstreamId: string
}

/** Konnect Target form config */
export interface KonnectTargetFormConfig extends KonnectBaseFormConfig, BaseTargetFormConfig {}

/** Kong Manager Target form config */
export interface KongManagerTargetFormConfig extends KongManagerBaseFormConfig, BaseTargetFormConfig {}

export interface TargetFormFields {
  target: string
  weight: number
  tags?: string
  failover?: boolean
}

export interface TargetFormState {
  /** Form fields */
  fields: TargetFormFields
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
