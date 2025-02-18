import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import App from './App.vue'

const app = createApp(App)

const init = async () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'redis-configuration-list',
        component: () => import('./pages/RedisConfigurationListPage.vue'),
      },
      {
        path: '/redis-configuration/create',
        name: 'create-redis-configuration',
        component: () => import('./pages/RedisConfigurationFormPage.vue'),
      },
      {
        path: '/redis-configuration/edit/:id',
        name: 'edit-redis-configuration',
        component: () => import('./pages/RedisConfigurationFormPage.vue'),
      },
      {
        path: '/redis-configuration/:id',
        name: 'view-redis-configuration',
        component: () => import('./pages/RedisConfigurationDetail.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
