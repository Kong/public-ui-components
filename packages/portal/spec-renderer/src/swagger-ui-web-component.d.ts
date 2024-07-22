declare module '@kong-ui-public/swagger-ui-web-component' {
  // OperationListItem has to exist here until swagger-ui-web-component is typed
  export interface OperationListItem {
    path: string
    method: 'get' | 'put' | 'post' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace'
    operationId: string | null
    summary: string | null
    deprecated: boolean
    tag: string | null
  }

  export class SwaggerUIElement extends HTMLElement {
    showOperation(operation: OperationListItem): boolean
    hideOperation(operation: OperationListItem): boolean
    scrollToOperation(operation: OperationListItem): boolean
  }
}
