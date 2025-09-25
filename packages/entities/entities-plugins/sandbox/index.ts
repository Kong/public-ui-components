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
        name: 'home',
        component: () => import('./pages/HomePage.vue'),
      },
      {
        path: '/plugin',
        name: 'list-plugin',
        component: () => import('./pages/PluginListPage.vue'),
      },
      {
        path: '/plugin/select',
        name: 'select-plugin',
        component: () => import('./pages/PluginSelectPage.vue'),
      },
      {
        path: '/plugin/create/:plugin',
        name: 'create-plugin',
        props: true,
        component: () => import('./pages/PluginFormPage.vue'),
      },
      {
        path: '/custom-plugin/create',
        name: 'create-custom-plugin',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/plugin/:plugin/:id',
        name: 'view-plugin',
        component: () => import('./pages/PluginConfigCardPage.vue'),
        props: true,
      },
      {
        path: '/custom-plugin/:plugin/edit',
        name: 'edit-custom-plugin',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/plugin/:plugin/:id/edit',
        name: 'edit-plugin',
        props: true,
        component: () => import('./pages/PluginFormPage.vue'),
      },
      {
        path: '/plugin/playground',
        name: 'plugin-form-playground',
        component: () => import('./pages/PluginFormPlayground.vue'),
      },
      {
        path: '/service/:id',
        name: 'view-service',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/route/:id',
        name: 'view-route',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/consumer/:id',
        name: 'view-consumer',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/consumer_group/:id',
        name: 'view-consumer_group',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/plugin/:id/configure-dynamic-ordering',
        name: 'configure-dynamic-ordering',
        component: () => import('./pages/FallbackPage.vue'),
      },
      {
        path: '/free-form/mocking',
        name: 'free-form',
        component: () => import('./pages/FreeFormPage.vue'),
      },
      {
        path: '/code-editor',
        name: 'code-editor',
        component: () => import('./pages/PluginConfigEditorPage.vue'),
      },
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
