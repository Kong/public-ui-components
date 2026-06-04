import useI18n from './useI18n'
import { useTableDataGridConfig } from './useTableDataGridConfig'
import { useTableDataGridColumnDefs } from './useTableDataGridColumnDefs'
import { useTableDataGridColumnSizing } from './useTableDataGridColumnSizing'
import { useTableDataGridPagination } from './useTableDataGridPagination'
import { useTableDataGridSelection } from './useTableDataGridSelection'
import { useTableDataGridColumnLayoutSync } from './useTableDataGridColumnLayoutSync'
import { useTableDataGridConfigSync } from './useTableDataGridConfigSync'
import { useTableDataGridGridLifecycle } from './useTableDataGridGridLifecycle'
import { useTableDataGridInfiniteFetch } from './useTableDataGridInfiniteFetch'
import { useTableDataGridInteractions } from './useTableDataGridInteractions'
import { useTableDataGridPaginationFetch } from './useTableDataGridPaginationFetch'
import { useTableDataGridRefreshTriggers } from './useTableDataGridRefreshTriggers'
import { useTableDataGridState } from './useTableDataGridState'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useTableDataGridConfig,
  useTableDataGridColumnDefs,
  useTableDataGridColumnSizing,
  useTableDataGridPagination,
  useTableDataGridSelection,
  useTableDataGridColumnLayoutSync,
  useTableDataGridConfigSync,
  useTableDataGridGridLifecycle,
  useTableDataGridInfiniteFetch,
  useTableDataGridInteractions,
  useTableDataGridPaginationFetch,
  useTableDataGridRefreshTriggers,
  useTableDataGridState,
  useI18n,
}
