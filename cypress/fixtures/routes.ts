import { createRouter, createWebHistory } from 'vue-router'

const PageStub = { template: '<div>Page Stub</div>' }

/**
 * Add any routes that need to exist for Cypress component tests here
 */
export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: PageStub,
    },
    {
      path: '/overview',
      name: 'overview',
      component: PageStub,
    },
    {
      path: '/runtime-manager',
      name: 'runtime-manager',
      component: PageStub,
      children: [
        {
          path: '/runtime-instances',
          name: 'runtime-instances',
          component: PageStub,
        },
      ],
    },
    {
      path: '/organization',
      name: 'organization',
      component: PageStub,
      children: [
        {
          path: '/teams',
          name: 'teams',
          component: PageStub,
        },
        {
          path: '/users',
          name: 'teams',
          component: PageStub,
        },
      ],
    },
    {
      path: '/settings',
      name: 'settings',
      component: PageStub,
      children: [
        {
          path: '/billing-settings',
          name: 'billing-settings',
          component: PageStub,
        },
        {
          path: '/auth-settings',
          name: 'auth-settings',
          component: PageStub,
        },
      ],
    },
    {
      path: '/personal-access-tokens',
      name: 'personal-access-tokens',
      component: PageStub,
    },
    {
      path: '/logout',
      name: 'logout',
      component: PageStub,
    },
    {
      path: '/404',
      name: '404',
      alias: '/:pathMatch(.*)*',
      component: PageStub,
    },
  ],
})
