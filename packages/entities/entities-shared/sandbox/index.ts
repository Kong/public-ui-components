import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)

app.use(Kongponents)
app.use(router)

app.mount('#app')
