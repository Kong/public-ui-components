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
        redirect: { name: 'consumer-list' },
      },
      {
        path: '/consumer-list',
        name: 'consumer-list',
        component: () => import('./pages/ConsumerListPage.vue'),
      },
      {
        path: '/consumers/create',
        name: 'create-consumer',
        component: () => import('./pages/ConsumerFormPage.vue'),
        props: true,
      },
      {
        path: '/consumers/:id',
        name: 'view-consumer',
        component: () => import('./pages/ConsumerConfigCardPage.vue'),
        props: true,
      },
      {
        path: '/consumers/:id/edit',
        name: 'edit-consumer',
        component: () => import('./pages/ConsumerFormPage.vue'),
        props: true,
      },
    ],
  })

  app.use(Kongponents)

  app.use(router)

  app.mount('#app')
}

init()
