import { createApp } from 'vue'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import { createRouter, createWebHistory } from 'vue-router'

import '@kong/kongponents/dist/style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./pages/HomePage.vue'),
      children: [
        {
          path: '',
          component: () => import('./pages/NestedPage.vue'),
        },
      ],
    },
    {
      path: '/gateway-services',
      component: () => import('./pages/HomePage.vue'),
      children: [
        {
          path: '',
          component: () => import('./pages/NestedPage.vue'),
        },
      ],
    },
  ],
})

const app = createApp(App)

app.use(Kongponents)
app.use(router)

app.mount('#app')
