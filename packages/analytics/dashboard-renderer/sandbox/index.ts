import { createApp } from 'vue'
import App from './App.vue'

import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

import sandboxQueryProvider from './sandbox-query-provider'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import { createRouter, createWebHistory } from 'vue-router'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/RendererDemo.vue'),
    },
  ],
})

// Define the sandbox layout links here
const appLinks: SandboxNavigationItem[] = ([
  {
    name: 'Dashboard Renderer',
    to: { name: 'home' },
  },
])

app.provide('app-links', appLinks)

app.use(Kongponents)
app.use(sandboxQueryProvider)

app.component('SandboxLayout', SandboxLayout)
app.use(router)

app.mount('#app')
