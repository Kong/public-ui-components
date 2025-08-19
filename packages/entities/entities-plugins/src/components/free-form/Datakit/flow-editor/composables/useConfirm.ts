import { inject, provide } from 'vue'
import { CONFIRM_MODAL_PROVIDE_KEY } from '../constants'
import useI18n from '../../../../../composables/useI18n'

export function provideConfirmModal(open: (msg: string) => Promise<boolean>) {
  provide(CONFIRM_MODAL_PROVIDE_KEY, open)
}

export function useConfirm() {
  const confirm = inject<(msg: string) => Promise<boolean>>(CONFIRM_MODAL_PROVIDE_KEY)
  if (!confirm) throw new Error('Confirm modal not provided')

  const { i18n: { t } } = useI18n()

  return function performConfirm(
    type: 'overrideEdges',
  ) {
    let confirmMsg = ''

    if (type === 'overrideEdges') {
      confirmMsg = t('plugins.free-form.datakit.flow_editor.confirm.overrideEdges.message')
    }

    return confirm(confirmMsg)
  }
}
