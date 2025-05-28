import useDataGenerator from './useDataGenerator'
import useEvaluateFeatureFlag from './useEvauluateFeatureFlag'
import useI18n from './useI18n'
import useRequestQueue from './useRequestQueue'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useDataGenerator,
  useI18n,
  useEvaluateFeatureFlag,
  useRequestQueue,
}
