import Kongponents from '@kong/kongponents'
import { createApp } from 'vue'
import App from './App.vue'

import '@kong/kongponents/dist/style.css'

const app = createApp(App)

app.use(Kongponents)

app.mount('#app')
