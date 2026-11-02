import useI18n from './useI18n'
import useSecretConfigStore from './useSecretConfigStore'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  useSecretConfigStore,
}
