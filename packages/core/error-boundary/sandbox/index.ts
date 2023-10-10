import { createApp } from 'vue'
import App from './App.vue'
import ErrorBoundaryPlugin from '../src'

const app = createApp(App)

app.use(ErrorBoundaryPlugin, {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onError: ({ error, context }) => {
    console.log('plugin-options: error', error, 'tags', context.tags)
  },
})

app.mount('#app')
