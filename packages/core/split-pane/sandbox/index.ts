import '@kong/kongponents/dist/style.css'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import Kongponents from '@kong/kongponents'

const app = createApp(App)

app.use(Kongponents)
app.use(router)
app.mount('#app')
