import { createApp } from 'vue'
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
      component: () => import('./pages/TimeSeriesChartDemo.vue'),
    },
    {
      path: '/bar-chart',
      name: 'bar-chart',
      component: () => import('./pages/BarChartDemo.vue'),
    },
    {
      path: '/donut-chart',
      name: 'donut-chart',
      component: () => import('./pages/DonutChartDemo.vue'),
    },
    {
      path: '/simple',
      name: 'simple',
      component: () => import('./pages/ChartDemoSimple.vue'),
    },
    {
      path: '/multichart',
      name: 'multichart',
      component: () => import('./pages/MultiChartDemo.vue'),
    },
    {
      path: '/sparkline',
      name: 'sparkline',
      component: () => import('./pages/SparklineDemo.vue'),
    },
  ],
})

// Define the sandbox layout links here
const appLinks: SandboxNavigationItem[] = ([
  {
    name: 'Time Series Chart',
    to: { name: 'home' },
  },
  {
    name: 'Bar Chart',
    to: { name: 'bar-chart' },
  },
  {
    name: 'Donut Chart',
    to: { name: 'donut-chart' },
  },
  {
    name: 'Simple Charts',
    to: { name: 'simple' },
  },
  {
    name: 'Multi Charts',
    to: { name: 'multichart' },
  },
  {
    name: 'Sparkline',
    to: { name: 'sparkline' },
  },
])

// Provide the app links to the SandboxLayout components
app.provide('app-links', appLinks)

app.use(Kongponents)
app.component('SandboxLayout', SandboxLayout)
app.use(router)

app.mount('#app')
