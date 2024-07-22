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
        redirect: { name: 'upstreams-list' },
      },
      {
        path: '/upstreams-list',
        name: 'upstreams-list',
        component: () => import('./pages/UpstreamsListPage.vue'),
      },
      {
        path: '/upstream/create',
        name: 'create-upstream',
        component: () => import('./pages/UpstreamFormPage.vue'),
      },
      {
        path: '/upstream/:id/config',
        name: 'config-upstream',
        component: () => import('./pages/UpstreamsConfigCardPage.vue'),
      },
      {
        path: '/upstream/:id/targets',
        name: 'view-upstream',
        component: () => import('./pages/TargetsListPage.vue'),
      },
      {
        path: '/upstream/:id/edit',
        name: 'edit-upstream',
        component: () => import('./pages/UpstreamFormPage.vue'),
      },
      {
        path: '/target/create',
        name: 'create-target',
        component: () => import('./pages/FallbackPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
