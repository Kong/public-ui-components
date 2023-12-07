export interface CsvKeyValuePair {
  [key: string]: string
}

export enum ValidType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Function = 'function',
  Undefined = 'undefined',
  Symbol = 'symbol'
}

export type CsvData = CsvKeyValuePair[]
