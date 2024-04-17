import useI18n from './useI18n'
import * as useLogLevels from './useLogLevels'
import * as useRequestScheduler from './useRequestScheduler'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  ...useLogLevels,
  ...useRequestScheduler,
}
