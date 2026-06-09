import type { ComputedRef, InjectionKey } from 'vue'
import type { PartialInfo } from './types'

export const REDIS_PARTIAL_INFO: InjectionKey<PartialInfo> = Symbol('redis-partial-info')
export const FORM_EDITING: InjectionKey<ComputedRef<boolean>> = Symbol('free-form-editing')

/** Register a before-save guard. The callback returns true to allow saving, false to block it. */
export const BEFORE_SAVE_KEY: InjectionKey<(cb: () => boolean) => void> = Symbol('before-save')

export const partialEndpoints = {
  konnect: {
    getOne: '/v2/control-planes/{controlPlaneId}/core-entities/partials/{id}',
    getAll: '/v2/control-planes/{controlPlaneId}/core-entities/partials',
  },
  kongManager: {
    getOne: '/{workspace}/partials/{id}',
    getAll: '/{workspace}/partials',
  },
}
