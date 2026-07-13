import type { StringFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

export function fillString(option: HandlerOption<StringFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  scrollIntoViewNative(selector)

  cy.get(selector).then(($el) => {
    cy.wrap($el).clear(SCROLL_BEHAVIOR)
    if (value !== undefined && value !== null && value !== '') {
      cy.wrap($el).type(String(value), SCROLL_BEHAVIOR)
    }
  })
}
