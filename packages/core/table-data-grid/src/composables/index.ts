import useI18n from './useI18n'
import { useTableDataGridConfig } from './useTableDataGridConfig'
import { useTableDataGridFetchers } from './useTableDataGridFetchers'
import { useDatatableColumnDefs } from './useDatatableColumnDefs'
import { useDatatableColumnSizing } from './useDatatableColumnSizing'
import { useDatatableGridSync } from './useDatatableGridSync'
import { useDatatablePagination } from './useDatatablePagination'
import { useDatatableSelection } from './useDatatableSelection'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useTableDataGridConfig,
  useTableDataGridFetchers,
  useDatatableColumnDefs,
  useDatatableColumnSizing,
  useDatatableGridSync,
  useDatatablePagination,
  useDatatableSelection,
  useI18n,
}
