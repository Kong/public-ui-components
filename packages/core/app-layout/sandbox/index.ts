import { createApp } from 'vue'
import App from './App.vue'
import AppLayout from '../src'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/LayoutPage.vue'),
    },
    {
      path: '/navbar',
      name: 'navbar',
      component: () => import('./pages/NavbarPage.vue'),
    },
    {
      path: '/sidebar',
      name: 'sidebar',
      component: () => import('./pages/SidebarPage.vue'),
    },
    {
      path: '/kong-manager-example',
      name: 'kong-manager-example',
      component: () => import('./pages/KongManagerLayoutExample.vue'),
    },
    {
      path: '/page-header',
      name: 'page-header',
      component: () => import('./pages/PageHeaderPage.vue'),
    },
    {
      path: '/page-content',
      name: 'page-content',
      component: () => import('./pages/PageContentPage.vue'),
    },
  ],
})

const app = createApp(App)

app.use(Kongponents)
app.use(router)
app.use(AppLayout)

app.mount('#app')
