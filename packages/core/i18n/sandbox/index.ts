import { createApp } from 'vue'
import App from './App.vue'

import { Translation, createI18n } from '../src/'
import english from './locales/en.json'
console.log(english)
const i18n = createI18n('en-us', english, true)
const app = createApp(App)
app.use(Translation, { i18n })

app.mount('#app')
