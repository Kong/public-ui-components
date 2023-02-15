import type { App } from 'vue'
import CopyUuid from './components/CopyUuid.vue'
import { COPY_UUID_NOTIFY_KEY } from './constants'
import type { CopyUuidInstallOptions } from './types'

// Export Vue plugin as the default
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered
  // name of your component (useful if exporting a single component).
  install: (app: App, options: CopyUuidInstallOptions & { name?: string } = {}): void => {
    if (typeof options?.notify === 'function') {
      app.provide(COPY_UUID_NOTIFY_KEY, options.notify)
    }
    app.component(options.name || 'CopyUuid', CopyUuid)
  },
}

export { CopyUuid }

export * from './constants'
export * from './types'
