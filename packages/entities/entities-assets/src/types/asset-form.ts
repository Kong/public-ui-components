import type { RouteLocationRaw } from 'vue-router'
import type { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface BaseAssetFormConfig extends Omit<BaseFormConfig, 'cancelRoute'>{
  /** Route to return to if canceling create/edit a Asset form */
  cancelRoute: RouteLocationRaw
}

/** Konnect Asset form config */
export interface KonnectAssetFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseAssetFormConfig {}

/** Kong Manager Asset form config */
export interface KongManagerAssetFormConfig extends Omit<KongManagerBaseFormConfig, 'cancelRoute'>, BaseAssetFormConfig {}

export interface AssetFormFields {
  name: string
  file: File | null
}

export interface AssetFormState {
  fields: AssetFormFields
  readonly: boolean
  errorMessage: string
}
