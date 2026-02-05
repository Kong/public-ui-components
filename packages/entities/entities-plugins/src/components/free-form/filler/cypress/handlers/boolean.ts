import type { BooleanFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from './types'

export function fillBoolean(option: HandlerOption<BooleanFieldSchema>): void {
  const { fieldKey, value, actionOptions = defaultActionOptions } = option

  const selector = selectors.field(fieldKey)

  if (value === true) {
    cy.get(selector).check(actionOptions.check)
  } else if (value === false) {
    cy.get(selector).uncheck(actionOptions.check)
  }
}
