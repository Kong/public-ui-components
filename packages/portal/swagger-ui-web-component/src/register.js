import { SwaggerUIElement } from './element'

export function register() {
  if (!customElements.get(SwaggerUIElement.name)) {
    customElements.define(SwaggerUIElement.name, SwaggerUIElement)
  } else {
    console.warn(`Cannot register ${SwaggerUIElement.name}. Element is already defined, ignoring`)
  }
}
