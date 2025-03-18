import useI18n from './useI18n'
import usePortFromProtocol from './getPortFromProtocol'
import useUrlValidators from './useUrlValidators'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  usePortFromProtocol,
  useUrlValidators,
}
