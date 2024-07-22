import { createApp, provide } from 'vue'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import { FORMS_API_KEY, VueFormGenerator } from '../src'

const app = createApp(App)

app.use(Kongponents)

// For correct rendering, host app should make the component available
// globally and provide the API endpoints for autosuggest
app.component('VueFormGenerator', VueFormGenerator)
provide(FORMS_API_KEY, {
  getOne: async () => ({}),
  getAll: async () => [{}],
})

app.mount('#app')
