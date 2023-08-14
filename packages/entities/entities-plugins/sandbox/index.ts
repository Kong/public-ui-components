import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)

const init = async () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: () => import('./pages/PluginListPage.vue'),
      },
      {
        path: '/plugin/create',
        name: 'create-plugin',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/plugin/:plugin/:id',
        name: 'view-plugin',
        component: () => import('./pages/PluginConfigCardPage.vue'),
        props: true,
      },
      {
        path: '/plugin/:id/edit',
        name: 'edit-plugin',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/service/:id',
        name: 'view-service',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/route/:id',
        name: 'view-route',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/consumer/:id',
        name: 'view-consumer',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/plugin/:id/configure-dynamic-ordering',
        name: 'configure-dynamic-ordering',
        component: () => import('./pages/FallbackPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
