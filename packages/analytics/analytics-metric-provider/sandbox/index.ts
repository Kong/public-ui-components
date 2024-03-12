import { createApp } from 'vue'
import App from './App.vue'
import '@kong/kongponents/dist/style.css'
import Kongponents from '@kong/kongponents'
import { createPinia } from 'pinia'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(Kongponents)

app.mount('#app')
