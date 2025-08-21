import { inject, provide } from 'vue'
import { CONFIRM_MODAL_PROVIDE_KEY } from '../constants'
import type { OpenConfirm } from '../modal/ConflictConnectionConfirmModal.vue'

export function provideConfirmModal(open: OpenConfirm) {
  provide(CONFIRM_MODAL_PROVIDE_KEY, open)
}

// For scenarios where the confirm modal is not needed
export function useOptionalConfirm() {
  return inject<OpenConfirm | undefined>(CONFIRM_MODAL_PROVIDE_KEY, undefined)
}

export function useConfirm() {
  const confirm = useOptionalConfirm()
  if (!confirm) throw new Error('Confirm modal not provided')

  return confirm
}
