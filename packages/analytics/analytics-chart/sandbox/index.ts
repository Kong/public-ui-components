import { createApp, type Plugin } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import { createPinia, setActivePinia } from 'pinia'
import type { AnalyticsBridge } from '@kong-ui-public/analytics-utilities'
import { INJECT_QUERY_PROVIDER } from '../src/constants'

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
      path: '/scatter-chart',
      name: 'scatter-chart',
      component: () => import('./pages/ScatterChartDemo.vue'),
    },
    {
      path: '/top-talkers',
      name: 'top-talkers',
      component: () => import('./pages/TopTalkersDemo.vue'),
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
    name: 'Scatter Chart',
    to: { name: 'scatter-chart' },
  },
  {
    name: 'Top Talkers',
    to: { name: 'top-talkers' },
  },
  {
    name: 'Sparkline',
    to: { name: 'sparkline' },
  },
])

// Provide the app links to the SandboxLayout components
app.provide('app-links', appLinks)

const pinia = createPinia()
setActivePinia(pinia)
app.use(pinia)

const sandboxQueryProvider: Plugin = {
  install(app) {
    app.provide(INJECT_QUERY_PROVIDER, {
      queryFn: () => Promise.reject('No query fn'),
      configFn: () => Promise.reject('No config fn'),
      datasourceConfigFn: async () => {
        return [{
          name: 'api_usage',
          showInUI: true,
          fields: [
            {
              'name': 'request_count',
              'label': 'Request count',
              'showInUI': true,
              'aggregation': true,
              'group': false,
              'filter': null,
              'metricGroup': 'count',
            },
          ],
          'timeRangeOptions': [
            '15m',
            '1h',
          ],
          'granularityOptions': [
            'tenSecondly',
            'thirtySecondly',
            'minutely',
            'fiveMinutely',
            'tenMinutely',
            'thirtyMinutely',
            'hourly',
            'twoHourly',
            'twelveHourly',
            'daily',
            'weekly',
            'monthly',
            'trend',
          ],
          defaultMetric: 'request_count',
        }]
      },
      evaluateFeatureFlagFn: () => true as any,
    } satisfies AnalyticsBridge)
  },
}

app.use(sandboxQueryProvider)
app.use(Kongponents)
app.component('SandboxLayout', SandboxLayout)
app.use(router)

app.mount('#app')
