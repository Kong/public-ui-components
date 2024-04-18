/** List field configuration */
export interface Field {
  /** Field label */
  label?: string
  /** Determines if the field is searchable */
  searchable?: boolean
  /** Determines if the field is sortable */
  sortable?: boolean
  /**
   * Determines if cells of this field should be wrapped inside KTooltips.
   * Need to use with max-width with EntityBaseTable's cellAttributes prop.
   */
  tooltip?: boolean
}
