import { createApp } from 'vue'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import '@kong/design-tokens/themes/classic-day.css'
import '@kong/design-tokens/themes/classic-night.css'

const app = createApp(App)

app.use(Kongponents)

app.mount('#app')
