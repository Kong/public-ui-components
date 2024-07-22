import { onBeforeUnmount } from 'vue'
import { ToastManager } from '@kong/kongponents'

export default function useToaster() {
  const toaster = new ToastManager()

  onBeforeUnmount(() => {
    toaster.destroy()
  })

  return { toaster }
}
