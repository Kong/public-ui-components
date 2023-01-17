import type { App } from 'vue'
import {%%COMPONENT_NAME%%} from './components/{%%COMPONENT_NAME%%}.vue'

// Export Vue plugin as the default
export default {
  // Customize Vue plugin options as desired
  // Providing a `name` property allows for customizing the registered
  // name of your component (useful if exporting a single component).
  install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
    app.component(options.name || '{%%COMPONENT_NAME%%}', {%%COMPONENT_NAME%%})
  },
}

export { {%%COMPONENT_NAME%%} }
