import type { ExpressionFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

/**
 * Fills the expression twin of an `expressible` field. Unlike a plain string
 * field, its textarea only exists once the "Add expression" trigger has been
 * used, so open it first when the field is still collapsed.
 */
export function fillExpression(option: HandlerOption<ExpressionFieldSchema>): void {
  const { fieldKey, value } = option

  const container = selectors.expression(fieldKey)

  scrollIntoViewNative(container)

  cy.get(container).then(($container) => {
    // No textarea means the editor is still behind its trigger.
    if ($container.find('textarea').length === 0) {
      cy.get(selectors.expressionAddBtn(fieldKey)).click(SCROLL_BEHAVIOR)
    }
  })

  cy.get(selectors.expressionInput(fieldKey)).then(($el) => {
    cy.wrap($el).clear(SCROLL_BEHAVIOR)
    if (value !== undefined && value !== null && value !== '') {
      cy.wrap($el).type(String(value), SCROLL_BEHAVIOR)
    }
  })
}
