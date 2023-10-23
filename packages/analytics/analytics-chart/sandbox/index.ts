import { createApp, provide } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/ChartDemo.vue'),
    },
    {
      path: '/simple',
      name: 'simple',
      component: () => import('./pages/ChartDemoSimple.vue'),
    },
  ],
})

// Define the sandbox layout links here
const appLinks: SandboxNavigationItem[] = ([
  {
    name: 'Analytics Charts',
    to: { name: 'home' },
  },
  {
    name: 'Simple Charts',
    to: { name: 'simple' },
  },
])

// Provide the app links to the SandboxLayout components
app.provide('app-links', appLinks)

app.use(Kongponents)
app.component('SandboxLayout', SandboxLayout)
app.use(router)

app.mount('#app')
