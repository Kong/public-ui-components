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
        redirect: { name: 'key-set-list' },
      },
      {
        path: '/key-set-list',
        name: 'key-set-list',
        component: () => import('./pages/KeySetListPage.vue'),
      },
      {
        path: '/key-set/create',
        name: 'create-key-set',
        component: () => import('./pages/KeySetFormPage.vue'),
      },
      {
        path: '/key-set/:id',
        name: 'view-key-set',
        props: true,
        component: () => import('./pages/KeySetConfigCardPage.vue'),
      },
      {
        path: '/key-set/:id/edit',
        name: 'edit-key-set',
        props: true,
        component: () => import('./pages/KeySetFormPage.vue'),
      },
    ],
  })

  app.use(Kongponents)

  app.use(router)

  app.mount('#app')
}

init()
