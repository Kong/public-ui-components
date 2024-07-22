import type { BaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'

export interface BaseSecretFormConfig extends Omit<BaseFormConfig, 'cancelRoute'> {
  /** Route to return to if canceling create/edit a Secret form */
  cancelRoute: RouteLocationRaw
}

/** Konnect Secret form config */
export interface KonnectSecretFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseSecretFormConfig { }

export interface SecretStateFields {
  key: string
  value: string
}

export interface SecretState {
  fields: SecretStateFields
  readonly: boolean
  errorMessage: string
}
