import useI18n from './useI18n'
import { useTableDataGridConfig } from './useTableDataGridConfig'
import { useTableDataGridFetch } from './useTableDataGridFetch'
import { useDatatableColumnDefs } from './useDatatableColumnDefs'
import { useDatatableColumnSizing } from './useDatatableColumnSizing'
import { useDatatablePagination } from './useDatatablePagination'
import { useDatatableSelection } from './useDatatableSelection'
import { useTableDataGridColumnLayoutSync } from './useTableDataGridColumnLayoutSync'
import { useTableDataGridConfigSync } from './useTableDataGridConfigSync'
import { useTableDataGridGridLifecycle } from './useTableDataGridGridLifecycle'
import { useTableDataGridInteractions } from './useTableDataGridInteractions'
import { useTableDataGridRefreshTriggers } from './useTableDataGridRefreshTriggers'
import { useTableDataGridState } from './useTableDataGridState'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useTableDataGridConfig,
  useTableDataGridFetch,
  useDatatableColumnDefs,
  useDatatableColumnSizing,
  useDatatablePagination,
  useDatatableSelection,
  useTableDataGridColumnLayoutSync,
  useTableDataGridConfigSync,
  useTableDataGridGridLifecycle,
  useTableDataGridInteractions,
  useTableDataGridRefreshTriggers,
  useTableDataGridState,
  useI18n,
}
