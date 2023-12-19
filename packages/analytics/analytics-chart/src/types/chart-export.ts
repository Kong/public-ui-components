export interface CsvKeyValuePair {
  [key: string]: string
}

export interface TimeFormatOptions {
  includeTZ?: boolean
  tz?: string
  short?: boolean
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
  label: string;
  key: string;
}

export type CsvData = CsvKeyValuePair[]
