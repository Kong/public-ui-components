import { SCROLL_BEHAVIOR } from './types'

/** Replace the whole Monaco model of the CEL input rendered at `selector`. */
export function fillCelInput(selector: string, value: unknown): void {
  const input = `${selector} .monaco-editor textarea`
  // Monaco loads lazily; a cold CI browser can exceed the default 4s wait.
  cy.get(input, { timeout: 20_000 }).should('be.visible')
  // Send select-all to Monaco so clearing replaces the entire model.
  cy.get(input).focus()
  cy.window().then((win) => {
    cy.get(input).type(win.navigator.userAgent.includes('Macintosh') ? '{meta}a' : '{ctrl}a', SCROLL_BEHAVIOR)
  })
  cy.get(input).type('{backspace}', SCROLL_BEHAVIOR)
  if (value !== undefined && value !== null && value !== '') {
    // A single input event preserves literal braces, Unicode and indentation.
    cy.get(input).invoke('val', String(value))
    cy.get(input).trigger('input', { inputType: 'insertFromPaste', force: true })
  }
  cy.get(input).type('{esc}', SCROLL_BEHAVIOR)
  cy.get(input).blur()
}
