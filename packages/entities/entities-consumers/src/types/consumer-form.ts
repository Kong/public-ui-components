import { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import { RouteLocationRaw } from 'vue-router'

export interface BaseConsumerFormConfig extends Omit<BaseFormConfig, 'cancelRoute'>{
  /** Route to return to if canceling create/edit a Consumer form */
  cancelRoute: RouteLocationRaw
}

/** Konnect Consumer form config */
export interface KonnectConsumerFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseConsumerFormConfig {}

/** Kong Manager Consumer form config */
export interface KongManagerConsumerFormConfig extends Omit<KongManagerBaseFormConfig, 'cancelRoute'>, BaseConsumerFormConfig {}

export interface ConsumerStateFields {
  username: string
  customId: string
  tags: string
}

export interface ConsumerPayload {
  username: string | null
  custom_id: string | null
  tags: string[]
}

export interface ConsumerState {
  fields: ConsumerStateFields
  readonly: boolean
  errorMessage: string
}
