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
        component: () => import('./pages/HomePage.vue'),
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
      {
        path: '/vault/:vaultId/secret/create',
        name: 'create-secret',
        component: () => import('./pages/SecretFormPage.vue'),
      },
      {
        path: '/vault/:vaultId/secret/:secretId/edit',
        name: 'edit-secret',
        component: () => import('./pages/SecretFormPage.vue'),
      },
      {
        path: '/vault-secret-picker',
        name: 'vault-secret-picker',
        component: () => import('./pages/VaultSecretPickerPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
