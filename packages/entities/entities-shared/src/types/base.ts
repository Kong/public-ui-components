import type { TableHeader } from '@kong/kongponents'
/** List field configuration */
export interface Field extends Omit<TableHeader, 'key' | 'tooltip'> {
  /** Determines if the field is searchable */
  searchable?: boolean
  /**
   * Determines if cells of this field should be wrapped inside KTooltips.
   * Need to use with max-width with EntityBaseTable's cellAttributes prop.
   */
  tooltip?: boolean
}
