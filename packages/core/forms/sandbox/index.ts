import { createApp } from 'vue'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import { VueFormGenerator } from '../src'

const app = createApp(App)

app.use(Kongponents)

// For correct rendering, host app should make the component available
// globally and provide the API endpoints for autosuggest
app.component('VueFormGenerator', VueFormGenerator)

app.mount('#app')
