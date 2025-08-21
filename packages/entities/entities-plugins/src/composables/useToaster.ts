import type { Toast, ToastManager } from '@kong/kongponents'
import { TOASTER_PROVIDER } from '../constants'
import { inject } from 'vue'

/**
 * Use the toaster instance from the host app.
 */
export function useToaster() {
  const defaultOpen = (...args: any[]) => {
    console.warn('TOASTER_PROVIDER is not provided', ...args)
  }
  const open = inject<ToastManager['open']>(TOASTER_PROVIDER, defaultOpen)

  // For better type inference
  return (options: Toast) => open(options)
}
