import type { StringFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from '../../shared/types'

export function fillString(option: HandlerOption<StringFieldSchema>): void {
  const { fieldKey, value, actionOptions = defaultActionOptions } = option

  const selector = selectors.field(fieldKey)

  cy.get(selector).then(($el) => {
    if (actionOptions.clear !== false) {
      cy.wrap($el).clear(actionOptions.clear)
    }
    if (value !== undefined && value !== null && value !== '') {
      cy.wrap($el).type(String(value), actionOptions.type)
    }
  })
}
