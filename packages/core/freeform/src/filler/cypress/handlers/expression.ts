import type { ExpressionFieldSchema, StringFieldSchema } from '../../../form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'
import { fillNativeString } from './string'

/**
 * Open a collapsed expression twin before filling its string control.
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

  fillTextControl(option)
}

/** A condition or ACL rule also has a string schema. The rendered control selects the editing method. */
export function fillTextControl(option: HandlerOption<StringFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  scrollIntoViewNative(selector)

  cy.get(selector).then(($el) => {
    if ($el.hasClass('cel-input')) {
      const input = `${selector} .monaco-editor textarea`
      // Monaco loads lazily; a cold CI browser can exceed the default 4s wait.
      cy.get(input, { timeout: 20_000 }).should('be.visible')
      // Send select-all to Monaco so clearing replaces the entire model.
      cy.get(input).focus()
      const isMac = $el[0].ownerDocument.defaultView!.navigator.userAgent.includes('Macintosh')
      cy.get(input).type(isMac ? '{meta}a' : '{ctrl}a', SCROLL_BEHAVIOR)
      cy.get(input).type('{backspace}', SCROLL_BEHAVIOR)
      if (value !== undefined && value !== null && value !== '') {
        // A single input event preserves literal braces, Unicode and indentation.
        cy.get(input).invoke('val', String(value))
        cy.get(input).trigger('input', { inputType: 'insertFromPaste', force: true })
      }
      cy.get(input).type('{esc}', SCROLL_BEHAVIOR)
      cy.get(input).blur()
      return
    }

    fillNativeString($el, value)
  })
}
