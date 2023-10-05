import { createApp } from 'vue'
import App from './App.vue'
import ErrorBoundaryPlugin from '../src'

const app = createApp(App)

app.use(ErrorBoundaryPlugin, {
  onError: ({ error, tags }) => {
    console.log('plugin-options: error', error, 'tags', tags)
  },
})

app.mount('#app')
