import { createApp } from 'vue'
import App from './App.vue'
import { GithubStar } from '../src'

const app = createApp(App)
app.component('GithubStar', GithubStar)
app.mount('#app')
