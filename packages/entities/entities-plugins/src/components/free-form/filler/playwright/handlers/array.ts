import type { ArrayHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillArray(option: ArrayHandlerOption): Promise<void> {
  const { page, fieldKey, value, onFillItem } = option

  // Check if array is using tab container or basic container
  const tabContainerSelector = selectors.arrayTabContainer(fieldKey)
  const basicContainerSelector = selectors.arrayBasicContainer(fieldKey)

  const hasTabContainer = await page.locator(tabContainerSelector).count() > 0
  const hasBasicContainer = await page.locator(basicContainerSelector).count() > 0

  if (hasTabContainer || hasBasicContainer) {
    // Add items and fill each one
    for (let i = 0; i < value.length; i++) {
      // Clear previous items if any
      const itemRemoveBtnsSelector = selectors.arrayRemoveBtns(fieldKey)

      const removeNext = async () => {
        const count = await page.locator(itemRemoveBtnsSelector).count()
        if (count > 0) {
          await page.locator(itemRemoveBtnsSelector).first().click()
          await removeNext()
        }
      }
      await removeNext()

      if (!Array.isArray(value)) {
        return
      }

      // Click add button to add more items
      const addBtnSelector = selectors.arrayAddBtn(fieldKey)
      await page.locator(addBtnSelector).click()

      // Fill the item
      await onFillItem(i, value[i])
    }
  }
}
