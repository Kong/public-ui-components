import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

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
      path: '/trace-viewer',
      name: 'trace-viewer',
      component: () => import('./pages/TraceViewerPage.vue'),
    },
    {
      path: '/waterfall',
      name: 'waterfall',
      component: () => import('./pages/WaterfallPage.vue'),
    },
  ],
})

app.use(Kongponents)
app.use(router)
app.mount('#app')
