import { Field } from './index'

/** Base filter configuration */
interface BaseFilterConfig {
  /** If true, the filter will be an exact match filter, otherwise it will be a fuzzy match filter */
  isExactMatch: boolean
}

/** Exact match filter configuration */
export interface ExactMatchFilterConfig extends BaseFilterConfig {
  isExactMatch: true
  /** Placeholder for the exact match filter input */
  placeholder: string
}

/** Exact match filter fields */
export interface FilterFields {
  [key: string]: Field
}

/** Exact match filter schema */
export interface FilterSchema {
  [key: string]: {
    /** Used in the filter dropdown to determine the type of input */
    type: 'select' | 'number' | 'text'
    /** Options for the select input, only used if type is 'select' */
    values?: string[]
  }
}

/** Fuzzy match filter configuration */
export interface FuzzyMatchFilterConfig extends BaseFilterConfig {
  isExactMatch: false
  /** Fuzzy match filter fields */
  fields: FilterFields
  /** Fuzzy match filter schema */
  schema: FilterSchema
}
