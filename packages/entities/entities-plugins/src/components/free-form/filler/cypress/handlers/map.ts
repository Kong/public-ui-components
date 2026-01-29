import type { MapFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { defaultActionOptions } from './types'

export function fillMap(option: HandlerOption<MapFieldSchema>): void {
  const { fieldKey, value, actionOptions = defaultActionOptions } = option

  // Clear existing entries
  const kmRemoveBtnsSelector = selectors.kvRemoveBtns(fieldKey)

  const removeNext = () => {
    cy.get('body').then(($body) => {
      const $btn = $body.find(kmRemoveBtnsSelector).first()
      if ($btn.length > 0) {
        cy.wrap($btn).click()
        removeNext()
      }
    })
  }
  removeNext()

  if (typeof value !== 'object' || value == null) {
    return
  }

  const entries = Object.entries(value)
  if (entries.length === 0) {
    return
  }

  for (let i = 0; i < entries.length; i++) {
    const [key, val] = entries[i]

    // Click add button for additional entries
    const addBtnSelector = selectors.kvAddBtn(fieldKey)
    cy.get(addBtnSelector).click()

    // Fill key
    const keySelector = selectors.kvKey(fieldKey, i)
    cy.get(keySelector).then(($el) => {
      if (actionOptions.clear !== false) {
        cy.wrap($el).clear(actionOptions.clear)
      }
      cy.wrap($el).type(String(key), actionOptions.type)
    })

    // Fill value
    const valueSelector = selectors.kvValue(fieldKey, i)
    cy.get(valueSelector).then(($el) => {
      if (actionOptions.clear !== false) {
        cy.wrap($el).clear(actionOptions.clear)
      }
      cy.wrap($el).type(String(val), actionOptions.type)
    })
  }
}
