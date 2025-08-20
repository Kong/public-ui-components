import { inject, provide } from 'vue'
import { CONFIRM_MODAL_PROVIDE_KEY } from '../constants'
import type { OpenConfirm } from '../modal/ConfirmModal.vue'

export function provideConfirmModal(open: OpenConfirm) {
  provide(CONFIRM_MODAL_PROVIDE_KEY, open)
}

export function useConfirm() {
  const confirm = inject<OpenConfirm>(CONFIRM_MODAL_PROVIDE_KEY)
  if (!confirm) throw new Error('Confirm modal not provided')

  return confirm
}
