import type { CelFieldSchema, ExpressionFieldSchema } from '../../../form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'
import { fillString } from './string'

/**
 * Fills an expression twin or a frontend CEL field. Only twins can be collapsed
 * behind an "Add expression" trigger; explicit CEL fields render directly.
 */
export function fillExpression(option: HandlerOption<ExpressionFieldSchema | CelFieldSchema>): void {
  const { fieldKey, fieldSchema } = option

  if (fieldSchema.type !== 'cel') {
    const container = selectors.expression(fieldKey)

    scrollIntoViewNative(container)

    cy.get(container).then(($container) => {
      // An expanded CEL editor can still be loading Monaco asynchronously.
      if ($container.find('[data-testid^="ff-expression-add-"]').length) {
        cy.get(selectors.expressionAddBtn(fieldKey)).click(SCROLL_BEHAVIOR)
      }
    })
  }

  fillString(option)
}
