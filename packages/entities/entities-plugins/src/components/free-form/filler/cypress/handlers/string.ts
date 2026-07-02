import type { StringFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export function fillString(option: HandlerOption<StringFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  cy.get(selector).then(($el) => {
    cy.wrap($el).clear()
    if (value !== undefined && value !== null && value !== '') {
      cy.wrap($el).type(String(value))
    }
  })
}
