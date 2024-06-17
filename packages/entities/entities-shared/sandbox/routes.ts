import type { RouteRecordRaw } from 'vue-router'
export const routes: Array<RouteRecordRaw & { label?: string }> = [
  {
    path: '/',
    name: 'home',
    component: () => import('./pages/HomePage.vue'),
  },
  {
    path: '/entity-link',
    name: 'entity-link',
    label: 'EntityLink',
    component: () => import('./pages/EntityLinkPage.vue'),
  },
  {
    path: '/entity-delete-modal',
    name: 'entity-delete-modal',
    label: 'EntityDeleteModal',
    component: () => import('./pages/EntityDeleteModalPage.vue'),
  },
  {
    path: '/entity-base-config-card',
    name: 'entity-base-config-card',
    label: 'EntityBaseConfigCard',
    component: () => import('./pages/EntityBaseConfigCardPage.vue'),
  },
  {
    path: '/config-card-item',
    name: 'config-card-item',
    label: 'ConfigCardItem',
    component: () => import('./pages/ConfigCardItemPage.vue'),
  },
  {
    path: '/config-card-display',
    name: 'config-card-display',
    label: 'ConfigCardDisplay',
    component: () => import('./pages/ConfigCardDisplayPage.vue'),
  },
  {
    path: '/entity-base-form',
    name: 'entity-base-form',
    label: 'EntityBaseForm',
    component: () => import('./pages/EntityBaseFormPage.vue'),
  },
  {
    path: '/entity-base-table',
    name: 'entity-base-table',
    label: 'EntityBaseTable',
    component: () => import('./pages/EntityBaseTablePage.vue'),
  },
  {
    path: '/entity-filter',
    name: 'entity-filter',
    label: 'EntityFilter',
    component: () => import('./pages/EntityFilterPage.vue'),
  },
  {
    path: '/entity-form-section',
    name: 'entity-form-section',
    label: 'EntityFormSection',
    component: () => import('./pages/EntityFormSectionPage.vue'),
  },
  {
    path: '/entity-toggle-modal',
    name: 'entity-toggle-modal',
    label: 'EntityToggleModal',
    component: () => import('./pages/EntityToggleModalPage.vue'),
  },
  {
    path: '/sandbox-permissions-control',
    name: 'sandbox-permissions-control',
    label: 'SandboxPermissionsControl',
    component: () => import('./pages/SandboxPermissionsControlPage.vue'),
  },
  {
    path: '/entity-tooltip',
    name: 'entity-tooltip',
    label: 'EntityToolip',
    component: () => import('./pages/EntityTooltipPage.vue'),
  },
]
