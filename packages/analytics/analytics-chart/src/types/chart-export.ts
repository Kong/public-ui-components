// TODO: Remove these deprecated analytics-chart CSV export types after consumers migrate to @kong-ui-public/dashboard-renderer. MA-5236: https://konghq.atlassian.net/browse/MA-5236
export interface CsvKeyValuePair {
  [key: string]: string
}

export enum ValidType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Undefined = 'undefined',
}

export interface Header {
  label: string
  key: string
}

export interface TimeseriesColumn {
  label: string
  key: string
}

export type CsvData = CsvKeyValuePair[]
