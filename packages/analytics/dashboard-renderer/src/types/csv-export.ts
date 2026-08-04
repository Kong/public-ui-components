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
