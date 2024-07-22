import { createApp } from 'vue'
import App from './App.vue'

import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

import sandboxQueryProvider from './sandbox-query-provider'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/RendererDemo.vue'),
    },
    {
      path: '/',
      name: 'dynamic',
      component: () => import('./pages/DynamicDashboardDemo.vue'),
    },
    {
      path: '/grid-layout',
      name: 'grid',
      component: () => import('./pages/GridDemo.vue'),
    },
  ],
})

// Define the sandbox layout links here
const appLinks: SandboxNavigationItem[] = ([
  {
    name: 'Static Dashboard',
    to: { name: 'home' },
  },
  {
    name: 'Dynamic Dashboard',
    to: { name: 'dynamic' },
  },
  {
    name: 'Grid Layout',
    to: { name: 'grid' },
  },
])

const pinia = createPinia()
app.use(pinia)

app.provide('app-links', appLinks)

app.use(Kongponents)
app.use(sandboxQueryProvider)

app.component('SandboxLayout', SandboxLayout)
app.use(router)

app.mount('#app')
