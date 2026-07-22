import type { RecordHandlerOption } from './types'
import { selectors } from '../../shared/selectors'

export async function fillRecord(option: RecordHandlerOption): Promise<void> {
  const { page, fieldKey, onFillChildren } = option

  // Check if object has a toggle/switch
  const objectSwitchSelector = selectors.objectSwitch(fieldKey)

  const hasSwitch = await page.locator(objectSwitchSelector).count() > 0

  if (hasSwitch) {
    // The switch's clickable element is a `role="checkbox"` span that forwards
    // its click to a hidden native checkbox input several DOM/event hops away
    // (span click -> native input .click() -> its `input` event -> emitted
    // update:modelValue -> parent's v-model -> re-render -> span's
    // `aria-checked` attribute updates). That's too indirect for Playwright's
    // `.check()`/`.uncheck()` built-in "did the state actually change"
    // verification to reliably observe in time, so read `aria-checked`
    // ourselves and only click (a plain click, not check/uncheck) when the
    // switch isn't already in the desired state - clicking it unconditionally
    // would incorrectly re-toggle (and thus collapse, or re-enable) an object
    // that's already in the right state, e.g. when re-filling an edit form
    // whose existing data already enabled it.
    const switchControl = page
      .locator(objectSwitchSelector)
      .locator('..')
      .locator('[data-testid="switch-control"]')
    const isChecked = (await switchControl.getAttribute('aria-checked')) === 'true'
    const shouldBeChecked = option.value !== null && option.value !== undefined

    if (isChecked !== shouldBeChecked) {
      await switchControl.click({ force: true })

      if (shouldBeChecked) {
        // Enabling the switch expands the object's content via SlideTransition
        // (height animates from 0). Filling children immediately can hit them
        // mid-transition, when the content container still has height 0.
        // Wait for it to actually become visible instead of a blind fixed
        // delay, which can still race under CI load.
        await page.locator(selectors.objectContent(fieldKey)).waitFor({ state: 'visible' })
      }
    }

    if (!shouldBeChecked) {
      return
    }
  }

  // Fill children fields
  await onFillChildren()
}
