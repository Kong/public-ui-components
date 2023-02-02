import { OpenAPI } from 'openapi-types'

/**
 * OpenAPI specification document supporting OpenAPI v2 and v3 formats
 */
export type SpecDocument = OpenAPI.Document

/**
 * HTTP Method string
 */
export type MethodString = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace'

export interface Operation {
  path: string
  method: MethodString
  operationId: string | null
  summary: string | null
  deprecated: boolean
  tags?: string[]
}

/**
 * Operation details object.
 */
export interface OperationListItem extends Omit<Operation, 'tags'> {
  tag: string | null
}

interface ExternalDocumentation {
  description?: string
  url: string
}

export interface Tag {
  name: string
  description?: string
  externalDocs?: ExternalDocumentation
}

export interface OperationListFilterFunctionParams {
  items: OperationListItem[]
  query: string
}

export type OperationListFilterFunction = (params: OperationListFilterFunctionParams) => OperationListItem[]
