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
        path: '/add-sni/:id',
        name: 'add-sni',
        props: true,
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/certificate-list',
        name: 'certificate-list',
        component: () => import('./pages/CertificateListPage.vue'),
      },
      {
        path: '/ca-certificate-list',
        name: 'ca-certificate-list',
        component: () => import('./pages/CACertificateListPage.vue'),
      },
      {
        path: '/certificate/create',
        name: 'create-certificate',
        component: () => import('./pages/CertificateFormPage.vue'),
      },
      {
        path: '/certificate/:id',
        name: 'view-certificate',
        props: true,
        component: () => import('./pages/CertificateConfigCardPage.vue'),
      },
      {
        path: '/certificate/:id/edit',
        name: 'edit-certificate',
        props: true,
        component: () => import('./pages/CertificateFormPage.vue'),
      },
      {
        path: '/ca-certificate/create',
        name: 'create-ca-certificate',
        component: () => import('./pages/CACertificateFormPage.vue'),
      },
      {
        path: '/ca-certificate/:id',
        name: 'view-ca-certificate',
        props: true,
        component: () => import('./pages/CACertificateConfigCardPage.vue'),
      },
      {
        path: '/ca-certificate/:id/edit',
        name: 'edit-ca-certificate',
        props: true,
        component: () => import('./pages/CACertificateFormPage.vue'),
      },
    ],
  })

  app.use(Kongponents)

  app.use(router)
  app.mount('#app')
}

init()
