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
        redirect: { name: 'key-list' },
      },
      {
        path: '/key-list',
        name: 'key-list',
        component: () => import('./pages/KeyListPage.vue'),
      },
      {
        path: '/key/create',
        name: 'create-key',
        component: () => import('./pages/KeyFormPage.vue'),
      },
      {
        path: '/key/:id',
        name: 'view-key',
        props: true,
        component: () => import('./pages/KeyConfigCardPage.vue'),
      },
      {
        path: '/key/:id/edit',
        name: 'edit-key',
        props: true,
        component: () => import('./pages/KeyFormPage.vue'),
      },
    ],
  })

  app.use(Kongponents)

  app.use(router)

  app.mount('#app')
}

init()
