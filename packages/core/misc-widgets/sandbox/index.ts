import { createApp } from 'vue'
import App from './App.vue'
import { GithubStar } from '../src'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)
app.use(Kongponents)
app.component('GithubStar', GithubStar)
app.mount('#app')
