import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import CopyUuid from '@kong-ui-public/copy-uuid'
import '@kong-ui-public/copy-uuid/dist/style.css'

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
        path: '/consumer-credential-list',
        name: 'consumer-credential-list',
        component: () => import('./pages/ConsumerCredentialListPage.vue'),
      },
      {
        path: '/consumer-credential/create',
        name: 'create-consumer-credential',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/consumer-credential/:id/edit',
        name: 'edit-consumer-credential',
        component: () => import('./pages/FallbackPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(CopyUuid)

  app.use(router)

  app.mount('#app')
}

init()
