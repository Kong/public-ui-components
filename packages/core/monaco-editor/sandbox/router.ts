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
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
