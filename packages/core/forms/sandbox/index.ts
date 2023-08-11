import { createApp } from 'vue'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

import { vfgPlugin } from '../src'

const app = createApp(App)

app.use(Kongponents)
app.use(vfgPlugin, {
  apiService: {
    getOne: async () => ({}),
    getAll: async () => [{}],
  },
})

app.mount('#app')
