import type { StringFieldSchema } from '../../../form-schema'
import { type HandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
import { selectors } from '../../shared/selectors'

export function fillString(option: HandlerOption<StringFieldSchema>): void {
  const { fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  scrollIntoViewNative(selector)

  cy.get(selector).then(($el) => {
    if ($el.hasClass('cel-input')) {
      const input = `${selector} .monaco-editor textarea`
      // Monaco loads lazily; a cold CI browser can exceed the default 4s wait.
      cy.get(input, { timeout: 20_000 }).should('be.visible')
      // Send select-all to Monaco so clearing replaces the entire model.
      cy.get(input).focus()
      const isMac = $el[0].ownerDocument.defaultView!.navigator.userAgent.includes('Macintosh')
      cy.get(input).type(isMac ? '{meta}a' : '{ctrl}a', SCROLL_BEHAVIOR)
      cy.get(input).type('{backspace}', SCROLL_BEHAVIOR)
      if (value !== undefined && value !== null && value !== '') {
        // A single input event preserves literal braces, Unicode and indentation.
        cy.get(input).invoke('val', String(value))
        cy.get(input).trigger('input', { inputType: 'insertFromPaste', force: true })
      }
      cy.get(input).type('{esc}', SCROLL_BEHAVIOR)
      cy.get(input).blur()
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
