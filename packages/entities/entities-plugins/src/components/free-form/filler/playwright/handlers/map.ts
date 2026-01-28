import type { MapFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillMap(option: HandlerOption<MapFieldSchema>): Promise<void> {
  const { page, fieldKey, value } = option

  // Clear existing entries
  const removeNext = async () => {
    const removeBtnSelector = selectors.kvRemoveBtns(fieldKey)
    const removeBtnCount = await page.locator(removeBtnSelector).count()
    if (removeBtnCount === 0) {
      return
    }
    await page.locator(removeBtnSelector).first().click()
    await removeNext()
  }
  await removeNext()

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
    await page.locator(addBtnSelector).click()

    // Fill key
    const keySelector = selectors.kvKey(fieldKey, i)
    const keyElement = page.locator(keySelector)
    await keyElement.clear()
    await keyElement.fill(String(key))

    // Fill value
    const valueSelector = selectors.kvValue(fieldKey, i)
    const valueElement = page.locator(valueSelector)
    await valueElement.clear()
    await valueElement.fill(String(val))
  }
}
