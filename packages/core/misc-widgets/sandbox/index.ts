import { createApp } from 'vue'
import App from './App.vue'
import { GithubStar, SecretInput } from '../src'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)
app.use(Kongponents)
app.component('GithubStar', GithubStar)
app.component('SecretInput', SecretInput)
app.mount('#app')
