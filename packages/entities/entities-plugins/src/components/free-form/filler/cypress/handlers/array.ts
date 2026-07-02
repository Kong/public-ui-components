import { type ArrayHandlerOption, SCROLL_BEHAVIOR } from './types'
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
            cy.wrap($btn).click(SCROLL_BEHAVIOR)
            removeNext()
          }
        })
      }
      removeNext()

      if (!Array.isArray(value)) {
        return
      }

      // Add items and fill each one
      for (let i = 0; i < value.length; i++) {
        // Click add button to add more items.
        const addBtnSelector = selectors.arrayAddBtn(fieldKey)
        cy.get(addBtnSelector).click(SCROLL_BEHAVIOR)

        // For tab-appearance arrays, the newly added item's fields only exist
        // while its tab is active (see KTabs' v-if per-tab rendering). Wait for
        // it to actually become visible before filling it, instead of blindly
        // typing into whatever tab happens to be active at the time.
        cy.get(selectors.arrayItem(fieldKey, i)).should('be.visible')

        // Fill the item
        onFillItem(i, value[i])
      }
    }
  })
}
