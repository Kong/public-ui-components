import type { NumberLikeFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

export function fillNumber(option: HandlerOption<NumberLikeFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  scrollIntoViewNative(selector)

  cy.get(selector).then(($el) => {
    cy.wrap($el).clear(SCROLL_BEHAVIOR)
    if (value !== undefined && value !== null) {
      cy.wrap($el).type(String(value), SCROLL_BEHAVIOR)
    }
  })
}
