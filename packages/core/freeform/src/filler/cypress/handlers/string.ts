import { SCROLL_BEHAVIOR } from './types'

export function fillNativeString(element: JQuery<HTMLElement>, value: unknown): void {
  // Commit the clear before a controlled textarea can restore its old value.
  cy.wrap(element).clear(SCROLL_BEHAVIOR)
  cy.wrap(element).trigger('change')
  if (value !== undefined && value !== null && value !== '') {
    cy.wrap(element).type(String(value), { ...SCROLL_BEHAVIOR, parseSpecialCharSequences: false })
  }
  // Plain inputs also commit on blur when the form uses updateOnChange.
  cy.wrap(element).blur()
}
