import type { MapHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

function extractKidId(testId: string | null, fieldKey: string): string {
  if (!testId) {
    throw new Error(`Unable to find map entry test id for "${fieldKey}"`)
  }

  const match = testId.match(/kid:\d+/)

  if (!match) {
    throw new Error(`Unable to extract map entry kid id from test id "${testId}"`)
  }

  return match[0]
}

export async function fillMap(option: MapHandlerOption): Promise<void> {
  const { page, fieldKey, value, onFillEntry } = option

  // Clear existing entries
  const removeNext = async () => {
    const removeBtnSelector = selectors.mapRemoveBtns(fieldKey)
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

    await page.locator(selectors.mapAddBtn(fieldKey)).click()

    const containerSelector = selectors.mapContainer(fieldKey, i)
    const container = page.locator(containerSelector)
    await container.waitFor()

    const keyElement = page.locator(selectors.mapKey(fieldKey, i))
    await keyElement.clear()
    await keyElement.fill(String(key))

    const childField = container.locator(`[data-testid*="${fieldKey}.kid:"]`).first()
    await childField.waitFor()

    const kidId = extractKidId(await childField.getAttribute('data-testid'), fieldKey)

    await onFillEntry(kidId, val)
  }
}
