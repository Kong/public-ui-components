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
        redirect: { name: 'gateway-services-list' },
      },
      {
        path: '/gateway-service-list',
        name: 'gateway-services-list',
        component: () => import('./pages/GatewayServiceListPage.vue'),
      },
      {
        path: '/gateway-service/create',
        name: 'create-gateway-service',
        component: () => import('./pages/GatewayServiceFormPage.vue'),
      },
      {
        path: '/gateway-service/:id',
        name: 'view-gateway-service',
        component: () => import('./pages/GatewayServiceConfigCardPage.vue'),
        props: true,
      },
      {
        path: '/gateway-service/:id/edit',
        name: 'edit-gateway-service',
        component: () => import('./pages/GatewayServiceFormPage.vue'),
        props: true,
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
