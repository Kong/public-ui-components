import { createApp } from 'vue'
import App from './App.vue'

import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

import sandboxQueryProvider from './sandbox-query-provider'

const app = createApp(App)

app.use(Kongponents)
app.use(sandboxQueryProvider)

app.mount('#app')
