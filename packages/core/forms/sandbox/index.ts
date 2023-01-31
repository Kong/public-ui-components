import { createApp } from 'vue'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)
app.use(Kongponents)

app.mount('#app')
