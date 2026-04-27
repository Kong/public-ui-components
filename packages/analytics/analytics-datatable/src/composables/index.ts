import useI18n from './useI18n'
import { useAnalyticsDatatableConfig } from './useAnalyticsDatatableConfig'
import { useAnalyticsDatatableFetchers } from './useAnalyticsDatatableFetchers'
import { useDatatableColumnDefs } from './useDatatableColumnDefs'
import { useDatatableColumnSizing } from './useDatatableColumnSizing'
import { useDatatableGridSync } from './useDatatableGridSync'
import { useDatatablePagination } from './useDatatablePagination'
import { useDatatableSelection } from './useDatatableSelection'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useAnalyticsDatatableConfig,
  useAnalyticsDatatableFetchers,
  useDatatableColumnDefs,
  useDatatableColumnSizing,
  useDatatableGridSync,
  useDatatablePagination,
  useDatatableSelection,
  useI18n,
}
