import type { App } from 'vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import { KONG_UI_ERROR_BOUNDARY_ON_ERROR_INJECTION_KEY } from './constants'
import type { ErrorBoundaryPluginOptions } from './types'

// Export Vue plugin
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered
  // name of your component (useful if exporting a single component).
  install: (app: App, options: ErrorBoundaryPluginOptions = {}): void => {
    app.component(options.name || 'ErrorBoundary', ErrorBoundary)
    app.provide(KONG_UI_ERROR_BOUNDARY_ON_ERROR_INJECTION_KEY, options.onError)
  },
}

export { ErrorBoundary }

export * from './types'
