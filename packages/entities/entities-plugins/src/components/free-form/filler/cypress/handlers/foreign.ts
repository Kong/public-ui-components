import type { ForeignFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from '../../shared/types'

export function fillForeign(option: HandlerOption<ForeignFieldSchema>): void {
  const { fieldKey, value, actionOptions = defaultActionOptions } = option

  const selector = selectors.field(fieldKey)

  // For foreign fields, typically need to click to open selector and select item
  cy.get(selector).click(actionOptions.click)

  // Handle different value formats
  const itemValue = typeof value === 'object' && value?.id ? value.id : value

  if (itemValue) {
    // Look for select item with the id
    cy.get(`[data-testid="select-item-${itemValue}"]`).click(actionOptions.click)
  }
}
