import type { RecordHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillRecord(option: RecordHandlerOption): Promise<void> {
  const { page, fieldKey, onFillChildren } = option

  // Check if object has a toggle/switch
  const objectSwitchSelector = selectors.objectSwitch(fieldKey)

  const hasSwitch = await page.locator(objectSwitchSelector).count() > 0

  if ((option.value === null || option.value === undefined) && hasSwitch) {
    // Disable the object via switch. `uncheck` is a no-op if it's already
    // unchecked - a plain `.click()` would incorrectly re-toggle (and thus
    // re-enable) an already-disabled object when re-filling it with null,
    // e.g. on a second pass over the same form.
    await page
      .locator(objectSwitchSelector)
      .locator('..')
      .locator('[data-testid="switch-control"]')
      .uncheck({ force: true })
    return
  }

  if (hasSwitch) {
    // Enable the object via switch. `check` is a no-op if it's already
    // checked - a plain `.click()` would incorrectly re-toggle (and thus
    // collapse) an object that already has a value, e.g. when filling an
    // edit form whose existing data already enabled it.
    await page
      .locator(objectSwitchSelector)
      .locator('..')
      .locator('[data-testid="switch-control"]')
      .check({ force: true })

    // Enabling the switch expands the object's content via SlideTransition
    // (height animates from 0). Filling children immediately can hit them
    // mid-transition, when the content container still has height 0.
    // Wait for it to actually become visible instead of a blind fixed
    // delay, which can still race under CI load.
    await page.locator(selectors.objectContent(fieldKey)).waitFor({ state: 'visible' })
  }

  // Fill children fields
  await onFillChildren()
}
