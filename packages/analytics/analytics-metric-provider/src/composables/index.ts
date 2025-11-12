import useI18n from './useI18n'
import useMetricCardBuilder from './useMetricCardBuilder'
import useMetricFetcher from './useMetricFetcher'
import useTrendRange from './useTrendRange'
import useRequest from './useRequest'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  useMetricCardBuilder,
  useMetricFetcher,
  useTrendRange,
  useRequest,
}
