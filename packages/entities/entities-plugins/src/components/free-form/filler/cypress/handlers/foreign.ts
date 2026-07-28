import type { ForeignFieldSchema } from '../../../../../types/plugins/form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

export function fillForeign(option: HandlerOption<ForeignFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  // ForeignField.vue renders a plain text input where the referenced entity's
  // id is typed directly - there is no dropdown/select-item popover to pick from.
  const itemValue = typeof value === 'object' && value?.id ? value.id : value

  scrollIntoViewNative(selector)
  cy.get(selector).then(($el) => {
    cy.wrap($el).clear(SCROLL_BEHAVIOR)
    if (itemValue) {
      cy.wrap($el).type(String(itemValue), SCROLL_BEHAVIOR)
    }
  })
}
