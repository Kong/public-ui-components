import type { ComputedRef, InjectionKey } from 'vue'
import type { PartialInfo } from './types'

// String keys, the same as in `@kong-ui-public/forms`, so they also match the keys hosts
// and other packages (e.g. `@kong-ui-public/entities-redis-configurations`) provide or inject

/** The plugin form config, provided by `PluginEntityForm` */
export const FORMS_CONFIG = 'kong-ui-forms-config'

/** The entity API (`getOne`, `getAll`, `getAllV2`, `peek`), provided by `PluginEntityForm` */
export const FORMS_API_KEY = 'kong-ui-forms-api'

/** Used by `template` and `slot` */
export const AUTOFILL_SLOT_NAME = 'autofill'

/** Used by `provide` and `inject` */
export const AUTOFILL_SLOT = 'autofillSlot'

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
