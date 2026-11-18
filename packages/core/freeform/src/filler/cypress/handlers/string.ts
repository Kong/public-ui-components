import type { StringFieldSchema } from '../../../form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'
import { fillCelInput } from './cel'

export function fillString(option: HandlerOption<StringFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  scrollIntoViewNative(selector)

  cy.get(selector).then(($el) => {
    // Conditions, ACL rules and expression twins can render their string as a CEL input.
    if ($el.hasClass('cel-input')) {
      fillCelInput(selector, value)
      return
    }

    // Commit the clear before a controlled textarea can restore its old value.
    cy.wrap($el).clear(SCROLL_BEHAVIOR)
    cy.wrap($el).trigger('change')
    if (value !== undefined && value !== null && value !== '') {
      cy.wrap($el).type(String(value), { ...SCROLL_BEHAVIOR, parseSpecialCharSequences: false })
    }
    // Plain inputs also commit on blur when the form uses updateOnChange.
    cy.wrap($el).blur()
  })
}
