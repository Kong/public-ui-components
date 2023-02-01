import { OpenAPI } from 'openapi-types'

/**
 * OpenAPI specification document supporting OpenAPI v2 and v3 formats
 */
export type SpecDocument = OpenAPI.Document

/**
 * HTTP Method string
 */
export type MethodString = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace'

/**
 * Operation details object.
 */
export interface Operation {
  path: string
  method: MethodString
  operationId: string | null
  summary: string | null
  deprecated: boolean
  tag: string | null
}
