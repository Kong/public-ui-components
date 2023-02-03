import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/SpecRenderer.vue'),
    },
    {
      path: '/spec-details',
      name: 'spec-details',
      component: () => import('./pages/SpecDetails.vue'),
    },
    {
      path: '/spec-operations-list',
      name: 'spec-operations-list',
      component: () => import('./pages/SpecOperationsList.vue'),
    },
  ],
})

const app = createApp(App)

app.use(Kongponents)
app.use(router)

app.mount('#app')
