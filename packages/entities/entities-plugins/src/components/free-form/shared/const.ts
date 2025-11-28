import type { ComputedRef, InjectionKey } from 'vue'
import type { PartialInfo } from './types'

export const REDIS_PARTIAL_INFO: InjectionKey<PartialInfo> = Symbol('redis-partial-info')
export const FORM_EDITING: InjectionKey<ComputedRef<boolean>> = Symbol('free-form-editing')

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
