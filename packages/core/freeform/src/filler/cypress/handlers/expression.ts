import type { ExpressionFieldSchema, StringFieldSchema } from '../../../form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'
import { fillString } from './string'

/**
 * Fills the expression twin of an `expressible` field. Its input only exists
 * once the "Add expression" trigger has been used, so open it first when the
 * field is still collapsed. A host can render the twin as a CEL input.
 */
export function fillExpression(option: HandlerOption<ExpressionFieldSchema>): void {
  const { fieldKey } = option

  const container = selectors.expression(fieldKey)

  scrollIntoViewNative(container)

  cy.get(container).then(($container) => {
    // An expanded CEL editor can still be loading Monaco asynchronously.
    if ($container.find('[data-testid^="ff-expression-add-"]').length) {
      cy.get(selectors.expressionAddBtn(fieldKey)).click(SCROLL_BEHAVIOR)
    }
  })

  cy.get(selectors.field(fieldKey)).then(($el) => {
    if ($el.hasClass('cel-input')) fillCel(option)
    else fillString(option)
  })
}

/**
 * Fills a CEL input, such as an expression twin, a plugin condition or an ACL
 * rule, by replacing its whole Monaco model.
 */
export function fillCel(option: HandlerOption<StringFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)
  const input = `${selector} .monaco-editor textarea`

  scrollIntoViewNative(selector)

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
