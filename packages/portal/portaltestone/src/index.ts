import type { App } from 'vue'
import Portaltestone from './components/Portaltestone.vue'

// Export Vue plugin as the default
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered
  // name of your component (useful if exporting a single component).
  install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
    app.component(options.name || 'Portaltestone', Portaltestone)
  },
}

export { Portaltestone }
