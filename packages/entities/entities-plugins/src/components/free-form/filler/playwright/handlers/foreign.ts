import type { ForeignFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillForeign(option: HandlerOption<ForeignFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  const selector = selectors.field(fieldKey)

  // For foreign fields, typically need to click to open selector and select item
  await page.locator(selector).click()

  // Handle different value formats
  const itemValue = typeof value === 'object' && value?.id ? value.id : value

  if (itemValue) {
    // Look for select item with the id
    await page.locator(`[data-testid="select-item-${itemValue}"]`).click()
  }
}
