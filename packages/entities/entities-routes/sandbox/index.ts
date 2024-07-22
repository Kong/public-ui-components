import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)

// Initializing in an async function in order to fetch session and permissions data for the sandbox ONLY.
// DO NOT DO THIS IN AN ACTUAL APP
const init = async () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        redirect: { name: 'route-list' },
      },
      {
        path: '/route-list',
        name: 'route-list',
        component: () => import('./pages/RouteListPage.vue'),
      },
      {
        path: '/route/create',
        name: 'create-route',
        component: () => import('./pages/RouteFormPage.vue'),
      },
      {
        path: '/route/:id',
        name: 'view-route',
        component: () => import('./pages/RouteConfigCardPage.vue'),
        props: true,
      },
      {
        path: '/route/:id/edit',
        name: 'edit-route',
        component: () => import('./pages/RouteFormPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
