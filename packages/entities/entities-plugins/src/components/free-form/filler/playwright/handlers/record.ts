import type { RecordHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillRecord(option: RecordHandlerOption): Promise<void> {
  const { page, fieldKey, onFillChildren } = option

  // Check if object has a toggle/switch
  const objectSwitchSelector = selectors.objectSwitch(fieldKey)

  const hasSwitch = await page.locator(objectSwitchSelector).count() > 0

  if ((option.value === null || option.value === undefined) && hasSwitch) {
    // Disable the object via switch
    await page.locator(objectSwitchSelector).uncheck({ force: true })
    return
  }

  if (hasSwitch) {
    // Enable the object via switch
    await page.locator(objectSwitchSelector).check({ force: true })
  }

  // Fill children fields
  await onFillChildren()
}
