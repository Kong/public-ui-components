import { RouteLocationRaw } from 'vue-router'
import { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface BaseConsumerGroupFormConfig extends Omit<BaseFormConfig, 'cancelRoute'>{
  /** Route to return to if canceling create/edit a Consumer form */
  cancelRoute: RouteLocationRaw
}

/** Konnect Consumer form config */
export interface KonnectConsumerGroupFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseConsumerGroupFormConfig {}

/** Kong Manager Consumer form config */
export interface KongManagerConsumerGroupFormConfig extends Omit<KongManagerBaseFormConfig, 'cancelRoute'>, BaseConsumerGroupFormConfig {}

export interface ConsumerGroupFields {
  name: string,
  tags: string,
  consumers: string[]
}

export interface ConsumerGroupPayload extends Omit<ConsumerGroupFields, 'consumers' | 'tags'> {
  tags: string[]
}
export interface ConsumerGroupData extends ConsumerGroupFields {
  id: string
}

export interface ConsumerGroupState {
  fields: ConsumerGroupFields
  errorMessage: string
  readonly: boolean
}

export interface Consumer {
  created_at: number
  id: string
  tags: string[]
  updated_at: number
  username: string
}

export type ConsumerGroupActions = 'getConsumers' | 'create' | 'edit' | 'addConsumer' | 'removeConsumer'
