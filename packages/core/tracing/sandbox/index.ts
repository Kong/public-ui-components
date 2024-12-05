import Kongponents from '@kong/kongponents'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

import '@kong/kongponents/dist/style.css'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/HomePage.vue'),
    },
    {
      path: '/lifecycle',
      name: 'lifecycle',
      component: () => import('./pages/LifecycleViewPage.vue'),
    },
    {
      path: '/trace',
      name: 'trace',
      component: () => import('./pages/TraceViewPage.vue'),
    },
    {
      path: '/waterfall',
      name: 'waterfall',
      component: () => import('./pages/WaterfallViewPage.vue'),
    },
  ],
})

app.use(Kongponents)
app.use(router)
app.mount('#app')
