import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import App from './App.vue'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/FreeFormDemo.vue'),
    },
  ],
})

app.use(Kongponents)
app.use(router)
app.mount('#app')
