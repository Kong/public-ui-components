import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./pages/HomePage.vue'),
  },
  {
    path: '/full',
    name: 'FullPage',
    component: () => import('./pages/FullPage.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
