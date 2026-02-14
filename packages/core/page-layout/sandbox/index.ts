import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('./pages/HomePage.vue'),
      children: [
        {
          path: '',
          component: () => import('./pages/NestedPage.vue'),
        },
      ],
    },
  ],
})

const app = createApp(App)

app.use(router)

app.mount('#app')
