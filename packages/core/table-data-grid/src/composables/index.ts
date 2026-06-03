import useI18n from './useI18n'
import { useTableDataGridConfig } from './useTableDataGridConfig'
import { useTableDataGridFetch } from './useTableDataGridFetch'
import { useDatatableColumnDefs } from './useDatatableColumnDefs'
import { useDatatableColumnSizing } from './useDatatableColumnSizing'
import { useDatatableGridSync } from './useDatatableGridSync'
import { useDatatablePagination } from './useDatatablePagination'
import { useDatatableSelection } from './useDatatableSelection'
import { useTableDataGridInteractions } from './useTableDataGridInteractions'
import { useTableDataGridRefreshTriggers } from './useTableDataGridRefreshTriggers'
import { useTableDataGridState } from './useTableDataGridState'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useTableDataGridConfig,
  useTableDataGridFetch,
  useDatatableColumnDefs,
  useDatatableColumnSizing,
  useDatatableGridSync,
  useDatatablePagination,
  useDatatableSelection,
  useTableDataGridInteractions,
  useTableDataGridRefreshTriggers,
  useTableDataGridState,
  useI18n,
}
