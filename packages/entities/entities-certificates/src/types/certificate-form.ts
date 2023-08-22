import type { RouteLocationRaw } from 'vue-router'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'

/** Konnect certificate form config */
export interface KonnectCertificateFormConfig extends KonnectBaseFormConfig {
  /** Route to return to if canceling create/edit a certificate */
  cancelRoute: RouteLocationRaw
}

/** Kong Manager certificate form config */
export interface KongManagerCertificateFormConfig extends KongManagerBaseFormConfig {
  /** Route to return to if canceling create/edit a certificate */
  cancelRoute: RouteLocationRaw
}

export interface CertificateFormFields {
  cert: string
  key: string
  certAlt: string
  keyAlt: string
  tags: string
}

export interface CACertificateFormFields {
  cert: string
  certDigest: string
  tags: string
}

export interface CertificateFormState {
  /** Form fields */
  fields: CertificateFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}

export interface CACertificateFormState {
  /** Form fields */
  fields: CACertificateFormFields
  /** Form readonly state (only used when saving entity details) */
  isReadonly: boolean
  /** The error message to show on the form */
  errorMessage: string
}
