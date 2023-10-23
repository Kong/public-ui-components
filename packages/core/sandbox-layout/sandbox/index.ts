import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'

const app = createApp(App)

app.use(Kongponents)

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./pages/LayoutPage.vue'),
      children: [
        {
          path: 'about',
          name: 'about',
          component: () => import('./pages/LayoutPage.vue'),
        },
      ],
    },
  ],
})

app.use(router)

app.mount('#app')
