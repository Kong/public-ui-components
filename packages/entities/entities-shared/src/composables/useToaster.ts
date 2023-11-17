import { ToastManager } from '@kong/kongponents'

export interface ToasterNotification {
  appearance: 'info' | 'success' | 'danger' | 'warning'
  message: string
  timeoutMilliseconds: number
}

// Initialize the ToastManager as a singleton so a new instance isn't created each time
const toaster = new ToastManager()

export default function useToaster() {
  const notify = async (notification: Partial<ToasterNotification>): Promise<void> => {
    const defaultConfig: ToasterNotification = {
      appearance: 'success',
      message: 'Success',
      timeoutMilliseconds: 3000,
    }

    toaster.open({
      ...defaultConfig,
      ...notification,
    })
  }

  return {
    notify,
  }
}
