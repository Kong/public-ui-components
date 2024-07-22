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
        redirect: { name: 'vault-list' },
      },
      {
        path: '/vault-list',
        name: 'vault-list',
        component: () => import('./pages/VaultListPage.vue'),
      },
      {
        path: '/vault/create',
        name: 'create-vault',
        component: () => import('./pages/VaultFormPage.vue'),
      },
      {
        path: '/vault/:id',
        name: 'view-vault',
        component: () => import('./pages/VaultConfigCardPage.vue'),
        props: true,
      },
      {
        path: '/vault/:id/edit',
        name: 'edit-vault',
        component: () => import('./pages/VaultFormPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
