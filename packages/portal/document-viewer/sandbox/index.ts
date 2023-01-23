import { createApp } from 'vue'
import App from './App.vue'
import DocumentPreview from '../src'

const app = createApp(App)

app.use(DocumentPreview)

app.mount('#app')
