export type MethodString = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace'

export interface Operation {
  path: string
  method: MethodString
  operationId: string | null
  summary: string | null
  deprecated: boolean
  tags: string[]
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
  items: Operation[]
  query: string
}

export type OperationListFilterFunction = (params: OperationListFilterFunctionParams) => Operation[]
