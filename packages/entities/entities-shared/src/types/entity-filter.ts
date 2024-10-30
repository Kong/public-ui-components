import type { SelectItem, SelectFilterFunctionParams } from '@kong/kongponents/dist/types'
import type { Field } from './index'

/** Base filter configuration */
interface BaseFilterConfig {
  /** If true, the filter will be an exact match filter, otherwise it will be a fuzzy match filter */
  isExactMatch: boolean
}

/**
 * Exact match filter configuration
 * FIXME: "Exact match" here is no longer accurate, in reality it works as an indicator
 * to use a single input field for filtering.
 */
export interface ExactMatchFilterConfig extends BaseFilterConfig {
  isExactMatch: true
  /** If provided, the filter will be a select input and the query will be the value of the selected item */
  selectItems?: SelectItem[]
  /** If selectItems is provided, we can customize the filter function */
  selectFilterFunction?: (params: SelectFilterFunctionParams) => SelectItem[] | boolean
  /** Placeholder for the exact match filter input */
  placeholder: string
}

/** Fuzzy match filter fields */
export interface FilterFields {
  [key: string]: Field
}

/** Fuzzy match filter schema */
export interface FilterSchema {
  [key: string]: {
    /** Used in the filter dropdown to determine the type of input */
    type: 'select' | 'number' | 'text'
    /** Options for the select input, only used if type is 'select' */
    values?: string[]
  }
}

/**
 * Fuzzy match filter configuration
 * FIXME: "Fuzzy match" here is no longer accurate, in reality it works as an indicator
 * to use a relatively complex form for filtering.
 */
export interface FuzzyMatchFilterConfig extends BaseFilterConfig {
  isExactMatch: false
  /** Fuzzy match filter fields */
  fields: FilterFields
  /** Fuzzy match filter schema */
  schema: FilterSchema
}
