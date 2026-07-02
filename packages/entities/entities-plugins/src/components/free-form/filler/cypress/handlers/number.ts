import type { NumberLikeFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export function fillNumber(option: HandlerOption<NumberLikeFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  cy.get(selector).then(($el) => {
    cy.wrap($el).clear()
    if (value !== undefined && value !== null) {
      cy.wrap($el).type(String(value))
    }
  })
}
