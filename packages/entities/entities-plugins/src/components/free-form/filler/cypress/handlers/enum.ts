import type { StringFieldSchema, NumberLikeFieldSchema, SetFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from './types'
import { isMultiEnumField } from '../../shared/schema-utils'

export function fillEnum(option: HandlerOption<StringFieldSchema | NumberLikeFieldSchema | SetFieldSchema>): void {
  const { fieldKey, fieldSchema, value, actionOptions = defaultActionOptions } = option

  const isMulti = isMultiEnumField(fieldSchema)
  const values = isMulti ? (Array.isArray(value) ? value : [value]) : [value]

  const fieldSelector = selectors.field(fieldKey)
  const firstItemSelector = selectors.field(`${fieldKey}.0`)
  const addBtnSelector = selectors.arrayAddBtn(fieldKey)

  // If a tag input exists, the renderer is StringArrayField; use its selector
  cy.get('body').then(($body) => {
    if (isMulti && $body.find(firstItemSelector).length === 0) {
      if ($body.find(addBtnSelector).length > 0) {
        cy.get(addBtnSelector).click()
      }
    }

    // Click to open dropdown
    const selectorToClick = isMulti ? firstItemSelector : fieldSelector
    cy.get(selectorToClick).scrollIntoView()
    cy.get(selectorToClick).click(actionOptions.click)

    // Select each value within the dropdown
    for (const optionValue of fieldSchema.one_of ?? (fieldSchema as SetFieldSchema).elements?.one_of ?? []) {
      if (optionValue !== undefined && optionValue !== null) {
        const itemSelector = isMulti
          ? selectors.multiSelectItem(String(optionValue))
          : selectors.selectItem(String(optionValue))

        // clear default value
        if (isMulti) {
          cy.get(itemSelector).within(($el) => {
            if ($el.find('button.selected').length > 0) {
              cy.get('button').click() // Value can't be selected when force: true is set, not sure why
            }
          })
        }

        if (values.includes(optionValue)) {
          cy.get(itemSelector).click() // Value can't be selected when force: true is set, not sure why
        }
      }
    }
  })
}
