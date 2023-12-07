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

export type CsvData = CsvKeyValuePair[]
