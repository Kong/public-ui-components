import type { ForeignFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

export function fillForeign(option: HandlerOption<ForeignFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  // For foreign fields, typically need to click to open selector and select item
  scrollIntoViewNative(selector)
  cy.get(selector).click(SCROLL_BEHAVIOR)

  // Handle different value formats
  const itemValue = typeof value === 'object' && value?.id ? value.id : value

  if (itemValue) {
    // Look for select item with the id
    cy.get(`[data-testid="select-item-${itemValue}"]`).click(SCROLL_BEHAVIOR)
  }
}
