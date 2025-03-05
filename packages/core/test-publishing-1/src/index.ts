// import type { App } from 'vue'
import TestPublishing1 from './components/TestPublishing1.vue'

// Export Vue plugin
// We rarely want to export components as a plugin as we prefer to support proper tree-shaking in the host application. Only enable if you're packing a Vue plugin.
// export default {
//   // Customize Vue plugin options as desired
//   // Providing a `name` property allows for customizing the registered
//   // name of your component (useful if exporting a single component).
//   install: (app: App, options: { name?: string, [key: string]: any } = {}): void => {
//     app.component(options.name || 'TestPublishing1', TestPublishing1)
//   },
// }

export { TestPublishing1 }

console.log('here is the test')
