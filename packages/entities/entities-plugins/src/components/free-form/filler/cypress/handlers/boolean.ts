import type { BooleanFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR } from './types'
import { selectors } from '../../shared/selectors'

export function fillBoolean(option: HandlerOption<BooleanFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  if (value === true) {
    cy.get(selector).check(SCROLL_BEHAVIOR)
  } else if (value === false) {
    cy.get(selector).uncheck(SCROLL_BEHAVIOR)
  }
}
