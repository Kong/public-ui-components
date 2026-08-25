import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Kongponents from '@kong/kongponents'
import '@kong/kongponents/dist/style.css'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import App from './App.vue'

const app = createApp(App)

const init = async () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        // `SandboxLayout`'s mobile title link and this sandbox's "cancel/back"
        // routes point at `home` — keep the name resolvable and just redirect
        // it to the plugin list, which now doubles as this sandbox's home page.
        path: '/',
        name: 'home',
        redirect: { name: 'list-plugin' },
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
        path: '/plugin/catalog',
        name: 'plugin-catalog',
        component: () => import('./pages/PluginCatalogPage.vue'),
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
        component: () => import('./pages/CustomPluginFormPage.vue'),
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
        props: true,
        component: () => import('./pages/CustomPluginFormPage.vue'),
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
        path: '/onboarding/auth-plugin',
        name: 'auth-plugin-onboarding-card',
        component: () => import('./pages/AuthPluginOnboardingCardPage.vue'),
      },
      {
        path: '/onboarding/auth-plugin/:plugin/create-consumer',
        name: 'create-consumer-credential-form',
        props: true,
        component: () => import('./pages/CreateConsumerCredentialFormPage.vue'),
      },
      {
        path: '/onboarding/auth-plugin/:plugin/add-credential',
        name: 'add-credential-to-consumer-form',
        props: true,
        component: () => import('./pages/AddCredentialToConsumerFormPage.vue'),
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
        path: '/certificate/:id',
        name: 'view-certificate',
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
    ],
  })

  app.use(Kongponents)
  app.use(router)
  app.mount('#app')
}

init()
