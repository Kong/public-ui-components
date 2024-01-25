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
        redirect: { name: 'asset-list' },
      },
      {
        path: '/asset-list',
        name: 'asset-list',
        component: () => import('./pages/AssetListPage.vue'),
      },
      {
        path: '/assets/create',
        name: 'create-asset',
        component: () => import('./pages/AssetFormPage.vue'),
      },
      {
        path: '/assets/:id',
        name: 'view-asset',
        component: () => import('./pages/AssetListPage.vue'),
      },
      {
        path: '/assets/:id/edit',
        name: 'edit-asset',
        component: () => import('./pages/AssetFormPage.vue'),
      },
      {
        path: '/plugins/create',
        name: 'create-plugin',
        component: () => import('./pages/PluginFormPage.vue'),
      },
    ],
  })

  app.use(Kongponents)

  app.use(router)

  app.mount('#app')
}

init()
