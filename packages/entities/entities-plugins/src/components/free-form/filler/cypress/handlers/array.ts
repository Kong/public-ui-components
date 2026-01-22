import type { ArrayHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export function fillArray(option: ArrayHandlerOption): void {
  const { fieldKey, value, onFillItem } = option

  // Check if array is using tab container or basic container
  const tabContainerSelector = selectors.arrayTabContainer(fieldKey)
  const basicContainerSelector = selectors.arrayBasicContainer(fieldKey)

  cy.get('body').then(($body) => {
    const hasTabContainer = $body.find(tabContainerSelector).length > 0
    const hasBasicContainer = $body.find(basicContainerSelector).length > 0

    if (hasTabContainer || hasBasicContainer) {
      // Clear previous items if any
      const itemRemoveBtnsSelector = selectors.arrayRemoveBtns(fieldKey)

      const removeNext = () => {
        cy.get('body').then(($body) => {
          const $btn = $body.find(itemRemoveBtnsSelector).first()
          if ($btn.length > 0) {
            cy.wrap($btn).click()
            removeNext()
          }
        })
      }
      removeNext()

      if (!Array.isArray(value)) {
        return
      }

      // Save original scroll behavior and temporarily disable auto-scroll for sticky tab containers
      const originalScrollBehavior = Cypress.config('scrollBehavior')
      if (hasTabContainer) {
        Cypress.config('scrollBehavior', 'center')
      }

      // Add items and fill each one
      for (let i = 0; i < value.length; i++) {
        // Click add button to add more items
        const addBtnSelector = selectors.arrayAddBtn(fieldKey)
        cy.get(addBtnSelector).click()

        // Fill the item
        onFillItem(i, value[i])
      }

      // Restore original scroll behavior
      if (hasTabContainer) {
        Cypress.config('scrollBehavior', originalScrollBehavior)
      }
    }
  })
}
