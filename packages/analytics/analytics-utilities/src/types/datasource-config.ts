export interface OperatorIn {
  type: 'multi-value'
  ops: string[]
}

export interface OperatorEquals {
  type: 'single-value'
  ops: string[]
}

export interface OperatorEmpty {
  type: 'no-value'
  ops: string[]
}

export interface OperatorWildcard {
  type: 'single-value'
  ops: string[]
}

export interface OperatorInequality {
  type: 'single-value'
  ops: string[]
}

export type Operator =
  | OperatorIn
  | OperatorEquals
  | OperatorEmpty
  | OperatorWildcard
  | OperatorInequality

export type BaseFieldFilter = {
  valueType: string
  operators: Operator[]
  preSeededValues?: string[]
  allowNewValues?: boolean
  valuesNeedTranslation?: boolean
}

export interface RemoteLookupFilterDimension extends BaseFieldFilter {
  valueSource: 'ksearch'
  ksearchName: string
}

export interface StaticLookupFilterDimension extends BaseFieldFilter {
  valueType: 'string'
}

export interface NumberFilterDimension extends BaseFieldFilter {
  valueType: 'number'
}

export type FieldFilter =
  | RemoteLookupFilterDimension
  | StaticLookupFilterDimension
  | NumberFilterDimension

export interface Field {
  name: string
  showInUI: boolean
  aggregation: boolean
  group: boolean
  filter?: FieldFilter | null
  metricGroup?: string
}

export interface DatasourceConfig {
  name: string
  showInUI: boolean
  fields: Field[]
  timeRangeOptions: string[]
  granularityOptions?: string[]
  defaultMetric?: string
}
