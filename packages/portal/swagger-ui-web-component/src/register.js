import { SwaggerUIElement } from './element'

export function register() {
  customElements.define('kong-swagger-ui', SwaggerUIElement)
}
