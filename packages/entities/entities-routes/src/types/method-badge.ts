/** Route method values */
export enum Methods {
  GET = 'GET',
  PUT = 'PUT',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  CONNECT = 'CONNECT',
  TRACE = 'TRACE',
  CUSTOM = 'CUSTOM'
}

export type Method = keyof typeof Methods

/** Route method badge color config */
export interface MethodBadgeColors {
  color: string
  backgroundColor: string
}
