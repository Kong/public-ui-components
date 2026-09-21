import { type ArrayHandlerOption, SCROLL_BEHAVIOR, scrollIntoViewNative } from './types'
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
        scrollIntoViewNative(addBtnSelector)
        cy.get(addBtnSelector).click(SCROLL_BEHAVIOR)

        // For tab-appearance arrays, a tab's fields only exist in the DOM
        // while that tab is active (KTabs uses v-if, not v-show, per tab -
        // see KTabs.vue). So existing IS the signal that this item's tab is
        // now active; `be.visible` is wrong here since it also demands the
        // item be scrolled into view and unobstructed by a fixed ancestor,
        // which is an unrelated concern already handled per-field via
        // scrollIntoViewNative/SCROLL_BEHAVIOR when each field is actually filled.
        cy.get(selectors.arrayItem(fieldKey, i)).should('exist')

        // Fill the item
        onFillItem(i, value[i])
      }
    }
  })
}
