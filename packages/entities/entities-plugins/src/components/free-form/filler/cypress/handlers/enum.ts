import type { StringFieldSchema, NumberLikeFieldSchema, SetFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { isMultiEnumField } from '../../shared/schema-utils'

export function fillEnum(option: HandlerOption<StringFieldSchema | NumberLikeFieldSchema | SetFieldSchema>): void {
  const { fieldKey, fieldSchema, value } = option

  const isMulti = isMultiEnumField(fieldSchema)
  const values = isMulti ? (Array.isArray(value) ? value : [value]) : [value]

  // Click to open dropdown
  const fieldSelector = selectors.field(fieldKey)
  cy.get(fieldSelector).scrollIntoView()
  cy.get(fieldSelector).click()

  // Scope all option interactions to this field's own popover to avoid matching
  // identically-named options from other enum fields on the same form.
  const popoverSelector = selectors.selectTrigger(fieldKey)
  cy.get(popoverSelector).scrollIntoView()

  // Select each value within the dropdown
  for (const optionValue of fieldSchema.one_of ?? (fieldSchema as SetFieldSchema).elements?.one_of ?? []) {
    if (optionValue !== undefined && optionValue !== null) {
      const itemSelector = isMulti
        ? selectors.multiSelectItem(String(optionValue))
        : selectors.selectItem(String(optionValue))

      // clear default value
      if (isMulti) {
        cy.get(popoverSelector).find(itemSelector).within(($el) => {
          if ($el.find('button.selected').length > 0) {
            cy.get('button').scrollIntoView()
            cy.get('button').click({ force: true })
          }
        })
      }

      if (values.includes(optionValue)) {
        cy.get(popoverSelector).find(itemSelector).scrollIntoView()
        cy.get(popoverSelector).find(itemSelector).click()
      }
    }
  }
}
