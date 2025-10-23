import useI18n from './useI18n'
import useLegendScale from './useLegendScale'
import useMetricFormat from './useMetricFormat'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useI18n,
  useLegendScale,
  useMetricFormat,
}
