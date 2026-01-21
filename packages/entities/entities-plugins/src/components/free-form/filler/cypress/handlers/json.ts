import type { JsonFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from '../../shared/types'

export function fillJson(option: HandlerOption<JsonFieldSchema>): void {
  const { fieldKey, value, actionOptions = defaultActionOptions } = option

  const selector = selectors.json(fieldKey)
  const jsonString = typeof value === 'string' ? value : JSON.stringify(value, null, 2)

  cy.get(selector).then(($el) => {
    if (actionOptions.clear !== false) {
      cy.wrap($el.find('textarea')).clear(actionOptions.clear)
    }
    cy.wrap($el.find('textarea')).type(jsonString, actionOptions.type)
  })
}
