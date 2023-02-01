declare module '@kong-ui-public/swagger-ui-web-component' {
  // Operation has to exist here until swagger-ui-web-component is typed
  export interface Operation {
    path: string
    method: 'get' | 'put' | 'post' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace'
    operationId: string | null
    summary: string | null
    deprecated: boolean
    tag: string | null
  }

  export class SwaggerUIElement extends HTMLElement {
    showOperation(operation: Operation): boolean
    hideOperation(operation: Operation): boolean
    scrollToOperation(operation: Operation): boolean
  }
}
