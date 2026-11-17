import { toValue, watch } from 'vue'
import { useFormShared } from './form-context'

import type { MaybeRefOrGetter } from 'vue'

/**
 * Opens a collapsed section when a reveal heads for a field inside it.
 *
 * For a section that hides its content but keeps it mounted (e.g. `KCollapse`,
 * which uses `v-show`): the fields inside are registered, so the form knows
 * which mounted field stands for the target. When that field's element is
 * inside `container`, `open` is called, and the reveal lands once the field
 * shows. A section that unmounts its content can't tell what is inside it.
 *
 * @param container The section's root element
 * @param open Opens the section; only view state should change
 */
export function useRevealOpen(container: MaybeRefOrGetter<Element | null | undefined>, open: () => void) {
  const { revealTarget, findCoveringElement } = useFormShared()

  watch(() => {
    const target = revealTarget.value
    const root = toValue(container)
    if (!target || !root) {
      return false
    }
    const element = findCoveringElement(target)
    return !!element && element !== root && root.contains(element)
  }, (inside) => {
    if (inside) {
      open()
    }
  }, { immediate: true })
}
