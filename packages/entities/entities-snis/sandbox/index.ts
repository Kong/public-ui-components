import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)

// Initializing in an async function in order to fetch session and permissions data for the sandbox ONLY.
const init = async () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        redirect: { name: 'snis-list' },
      },
      {
        path: '/snis',
        name: 'snis-list',
        component: () => import('./pages/SniListPage.vue'),
      },
      {
        path: '/snis/:id',
        name: 'view-sni',
        component: () => import('./pages/FallbackPage.vue'),
        props: true,
      },
      {
        path: '/snis/:id/edit',
        name: 'edit-sni',
        component: () => import('./pages/SniFormPage.vue'),
        props: true,
      },
      {
        path: '/snis/create',
        name: 'create-sni',
        component: () => import('./pages/SniFormPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
