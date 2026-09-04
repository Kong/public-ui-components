import useI18n from './useI18n'
import useEvaluateFeatureFlag from './useEvauluateFeatureFlag'
import useRequestQueue from './useRequestQueue'
import useContextLinks from './useContextLinks'
import useIssueQuery from './useIssueQuery'
import useDashboardContext from './useDashboardContext'
import useExportPdf from './useExportPdf'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useContextLinks,
  useDashboardContext,
  useEvaluateFeatureFlag,
  useExportPdf,
  useI18n,
  useIssueQuery,
  useRequestQueue,
}
