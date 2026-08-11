import type { JsonFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

export function fillJson(option: HandlerOption<JsonFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.json(fieldKey)
  const jsonString = typeof value === 'string' ? value : JSON.stringify(value, null, 2)

  scrollIntoViewNative(selector)

  cy.get(selector).then(($el) => {
    cy.wrap($el.find('textarea')).clear(SCROLL_BEHAVIOR)
    cy.wrap($el.find('textarea')).type(jsonString, SCROLL_BEHAVIOR)
  })
}
