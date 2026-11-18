import type { ExpressionFieldSchema } from '../../../form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'
import { fillString } from './string'

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

  fillString(option)
}
