import type { NumberLikeFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from './types'

export function fillNumber(option: HandlerOption<NumberLikeFieldSchema>): void {
  const { fieldKey, value, actionOptions = defaultActionOptions } = option

  const selector = selectors.field(fieldKey)

  cy.get(selector).then(($el) => {
    if (actionOptions.clear !== false) {
      cy.wrap($el).clear(actionOptions.clear)
    }
    if (value !== undefined && value !== null) {
      cy.wrap($el).type(String(value), actionOptions.type)
    }
  })
}
