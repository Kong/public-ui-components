import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./pages/HomePage.vue'),
  },
  {
    path: '/grid',
    name: 'Grid',
    component: () => import('./pages/GridPage.vue'),
  },
  {
    path: '/fetch',
    name: 'Fetch',
    component: () => import('./pages/FetchPage.vue'),
  },
  {
    path: '/toolbar',
    name: 'Toolbar',
    component: () => import('./pages/ToolbarPage.vue'),
  },
  {
    path: '/dynamic-lang',
    name: 'DynamicLang',
    component: () => import('./pages/DynamicLangPage.vue'),
  },
  {
    path: '/composable',
    name: 'Composable',
    component: () => import('./pages/ComposablePage.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
