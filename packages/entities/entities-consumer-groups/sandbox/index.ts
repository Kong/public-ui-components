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
        redirect: { name: 'consumer-group-list' },
      },
      {
        path: '/consumer-group-list',
        name: 'consumer-group-list',
        component: () => import('./pages/ConsumerGroupListPage.vue'),
      },
      {
        path: '/consumer-group/create',
        name: 'create-consumer-group',
        component: () => import('./pages/ConsumerGroupFormPage.vue'),
        props: true,
      },
      {
        path: '/consumer-group/:id',
        name: 'view-consumer-group',
        component: () => import('./pages/ConsumerGroupConfigCardPage.vue'),
        props: true,
      },
      {
        path: '/consumer-group/:id/edit',
        name: 'edit-consumer-group',
        component: () => import('./pages/ConsumerGroupFormPage.vue'),
        props: true,
      },
    ],
  })

  app.use(Kongponents)

  app.use(router)

  app.mount('#app')
}

init()
