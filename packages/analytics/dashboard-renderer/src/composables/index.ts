import useI18n from './useI18n'
import useEvaluateFeatureFlag from './useEvauluateFeatureFlag'
import useRequestQueue from './useRequestQueue'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  useEvaluateFeatureFlag,
  useRequestQueue,
}
